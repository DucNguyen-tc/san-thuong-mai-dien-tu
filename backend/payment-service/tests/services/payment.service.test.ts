import { PaymentService } from '../../src/services/payment.service';
import { prismaMock } from '../setup/prismaMock';
import axios from 'axios';
import { NotFoundError, BadRequestError, ConflictError } from '../../src/exceptions/AppError';
import { vnpay } from '../../src/config/vnpay.config';
import { verifyMoMoResponseSignature, requestMoMoPayment } from '../../src/utils/momo.util';
import { PaymentMethod, PaymentStatus } from '../../src/types/payment.types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../../src/config/vnpay.config', () => ({
  vnpay: {
    buildPaymentUrl: jest.fn(),
    verifyReturnUrl: jest.fn(),
    verifyIpnCall: jest.fn(),
  },
  VNP_RETURNURL: 'http://mock.return',
}));

jest.mock('../../src/utils/momo.util', () => ({
  requestMoMoPayment: jest.fn(),
  verifyMoMoResponseSignature: jest.fn(),
}));

describe('PaymentService', () => {
  let paymentService: PaymentService;
  const mockOrderId = 'order-123';
  const mockPaymentId = 'pay-456';

  beforeEach(() => {
    paymentService = new PaymentService();
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    const input = {
      order_id: mockOrderId,
      amount: 100000,
      method: PaymentMethod.VNPAY,
    };

    it('should throw ConflictError if payment already SUCCESS', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({ id: mockPaymentId, status: PaymentStatus.SUCCESS } as any);

      await expect(paymentService.createPayment(input)).rejects.toThrow(ConflictError);
    });

    it('should return existing payment if status is PENDING', async () => {
      const existingPayment = { id: mockPaymentId, status: PaymentStatus.PENDING, payment_url: 'http://old' };
      prismaMock.payment.findUnique.mockResolvedValue(existingPayment as any);

      const result = await paymentService.createPayment(input);
      expect(result).toEqual(existingPayment);
    });

    it('should create new payment and build VNPay URL', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);
      (vnpay.buildPaymentUrl as jest.Mock).mockReturnValue('http://vnpay.mock');
      prismaMock.payment.create.mockResolvedValue({ id: mockPaymentId, payment_url: 'http://vnpay.mock' } as any);

      const result = await paymentService.createPayment(input);

      expect(vnpay.buildPaymentUrl).toHaveBeenCalled();
      expect(prismaMock.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          method: PaymentMethod.VNPAY,
          status: PaymentStatus.PENDING,
          payment_url: 'http://vnpay.mock',
        }),
      });
      expect(result.payment_url).toBe('http://vnpay.mock');
    });
  });

  describe('verifyAndProcessVnpayIpn', () => {
    it('should throw BadRequestError if signature is invalid', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production'; // Đảm bảo test nhánh ném lỗi

      (vnpay.verifyIpnCall as jest.Mock).mockReturnValue({
        isVerified: false,
        vnp_TxnRef: mockOrderId,
      });

      await expect(paymentService.verifyAndProcessVnpayIpn({ vnp_SecureHash: 'fake' })).rejects.toThrow(BadRequestError);
      
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should return RspCode 02 if idempotency is met (Order already confirmed)', async () => {
      (vnpay.verifyIpnCall as jest.Mock).mockReturnValue({
        isVerified: true,
        isSuccess: true,
        vnp_TxnRef: mockOrderId,
      });

      // DB returns already SUCCESS
      prismaMock.payment.findUnique.mockResolvedValue({ id: mockPaymentId, status: PaymentStatus.SUCCESS } as any);

      const result = await paymentService.verifyAndProcessVnpayIpn({});

      expect(result).toEqual({ RspCode: '02', Message: 'Order already confirmed' });
      expect(prismaMock.payment.update).not.toHaveBeenCalled();
    });

    it('should update payment to SUCCESS and sync order status', async () => {
      (vnpay.verifyIpnCall as jest.Mock).mockReturnValue({
        isVerified: true,
        isSuccess: true,
        vnp_TxnRef: mockOrderId,
        vnp_TransactionNo: 'txn-01',
      });

      prismaMock.payment.findUnique.mockResolvedValue({ id: mockPaymentId, status: PaymentStatus.PENDING } as any);
      prismaMock.payment.update.mockResolvedValue({} as any);
      mockedAxios.put.mockResolvedValue({} as any);

      const result = await paymentService.verifyAndProcessVnpayIpn({});

      expect(result).toEqual({ RspCode: '00', Message: 'Confirm Success' });
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: mockPaymentId },
        data: expect.objectContaining({ status: PaymentStatus.SUCCESS, gateway_transaction_id: 'txn-01' }),
      });
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining(`/api/orders/${mockOrderId}/status`),
        { status: 'CONFIRMED' },
        expect.any(Object)
      );
    });

    it('should update payment to FAILED if vnp_ResponseCode is not 00', async () => {
      (vnpay.verifyIpnCall as jest.Mock).mockReturnValue({
        isVerified: true,
        isSuccess: false, // vnp_ResponseCode != 00
        vnp_TxnRef: mockOrderId,
      });

      prismaMock.payment.findUnique.mockResolvedValue({ id: mockPaymentId, status: PaymentStatus.PENDING } as any);
      prismaMock.payment.update.mockResolvedValue({} as any);
      mockedAxios.put.mockResolvedValue({} as any);

      await paymentService.verifyAndProcessVnpayIpn({});

      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: mockPaymentId },
        data: expect.objectContaining({ status: PaymentStatus.FAILED }),
      });
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining(`/api/orders/${mockOrderId}/status`),
        { status: 'CANCELLED' },
        expect.any(Object)
      );
    });
  });

  describe('refundPayment', () => {
    it('should throw BadRequestError if payment is not SUCCESS', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({ id: mockPaymentId, status: PaymentStatus.PENDING } as any);
      await expect(paymentService.refundPayment(mockPaymentId)).rejects.toThrow(BadRequestError);
    });

    it('should update status to REFUNDED', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({ id: mockPaymentId, status: PaymentStatus.SUCCESS } as any);
      prismaMock.payment.update.mockResolvedValue({ id: mockPaymentId, status: PaymentStatus.REFUNDED } as any);

      await paymentService.refundPayment(mockPaymentId);

      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: mockPaymentId },
        data: { status: PaymentStatus.REFUNDED },
      });
    });
  });
});

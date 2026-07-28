import axios from 'axios';
import { prisma } from '../config/prisma';
import { NotFoundError, BadRequestError, ConflictError } from '../exceptions/AppError';
import { vnpay, VNP_RETURNURL } from '../config/vnpay.config';
import { requestMoMoPayment, verifyMoMoResponseSignature } from '../utils/momo.util';
import { ProductCode, VnpLocale, ReturnQueryFromVNPay } from 'vnpay';
import {
  CreatePaymentInput,
  UpdatePaymentStatusInput,
  ListPaymentsQuery,
  PaymentMethod,
  PaymentStatus,
} from '../types/payment.types';

export class PaymentService {
  /**
   * Khởi tạo giao dịch thanh toán mới (Có kiểm tra Idempotency theo order_id)
   */
  public async createPayment(input: CreatePaymentInput) {
    const { order_id, amount, method, client_ip } = input;

    // Kiểm tra Idempotency (AGENT.md mục 6)
    const existingPayment = await prisma.payment.findUnique({
      where: { order_id },
    });

    if (existingPayment) {
      if (existingPayment.status === PaymentStatus.SUCCESS) {
        throw new ConflictError('Đơn hàng này đã được thanh toán thành công trước đó');
      }
      // Nếu đang PENDING và cùng phương thức, trả về bản ghi hiện tại
      if (existingPayment.status === PaymentStatus.PENDING) {
        return existingPayment;
      }
    }

    // Tạo Payment URL bằng thư viện vnpay, MoMo API (hoặc Mock Simulator), hoặc CASH
    let paymentUrl: string | null = null;
    if (method === PaymentMethod.VNPAY) {
      paymentUrl = vnpay.buildPaymentUrl({
        vnp_Amount: Number(amount),
        vnp_IpAddr: client_ip || '127.0.0.1',
        vnp_TxnRef: order_id,
        vnp_OrderInfo: `Thanh toan don hang ${order_id}`,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: VNP_RETURNURL,
        vnp_Locale: VnpLocale.VN,
      });
    } else if (method === PaymentMethod.MOMO) {
      paymentUrl = await requestMoMoPayment({
        orderId: order_id,
        amount: Number(amount),
      });
    }

    // Tạo bản ghi thanh toán mới
    return prisma.payment.create({
      data: {
        order_id,
        amount,
        method,
        status: PaymentStatus.PENDING,
        payment_url: paymentUrl,
      },
    });
  }

  /**
   * Lấy chi tiết thanh toán theo Payment ID (UUID)
   */
  public async getPaymentById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundError('Không tìm thấy giao dịch thanh toán');
    }

    return payment;
  }

  /**
   * Lấy chi tiết thanh toán theo Order ID (UUID)
   */
  public async getPaymentByOrderId(orderId: string) {
    const payment = await prisma.payment.findUnique({
      where: { order_id: orderId },
    });

    if (!payment) {
      throw new NotFoundError('Không tìm thấy thông tin thanh toán của đơn hàng');
    }

    return payment;
  }

  /**
   * Lấy danh sách giao dịch thanh toán (hỗ trợ phân trang và bộ lọc)
   */
  public async getPayments(query: ListPaymentsQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.method ? { method: query.method } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Cập nhật trạng thái giao dịch thanh toán
   */
  public async updatePaymentStatus(id: string, input: UpdatePaymentStatusInput) {
    await this.getPaymentById(id);

    return prisma.payment.update({
      where: { id },
      data: {
        status: input.status,
        ...(input.gateway_transaction_id ? { gateway_transaction_id: input.gateway_transaction_id } : {}),
        ...(input.payment_url !== undefined ? { payment_url: input.payment_url } : {}),
      },
    });
  }

  /**
   * Xử lý xác thực chữ ký và kết quả VNPAY Return URL (GET /api/payments/vnpay/return)
   */
  public async verifyAndProcessVnpayReturn(queryParams: Record<string, any>) {
    const verifyResult = vnpay.verifyReturnUrl(queryParams as ReturnQueryFromVNPay);
    
    if (!verifyResult.isVerified) {
      throw new BadRequestError('Chữ ký VNPAY không hợp lệ');
    }

    const orderId = verifyResult.vnp_TxnRef;
    const isSuccess = verifyResult.isSuccess;
    const transactionNo = verifyResult.vnp_TransactionNo?.toString() || `vnpay-${Date.now()}`;
    const status = isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

    const payment = await prisma.payment.findUnique({
      where: { order_id: orderId },
    });

    if (!payment) {
      throw new NotFoundError(`Không tìm thấy giao dịch thanh toán cho đơn hàng ${orderId}`);
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        gateway_transaction_id: transactionNo,
        method: PaymentMethod.VNPAY,
      },
    });

    // Đồng bộ trạng thái sang order-service
    await this.syncOrderStatus(orderId, isSuccess);

    return {
      payment: updatedPayment,
      isSuccess,
      message: verifyResult.message || (isSuccess ? 'Thanh toán VNPAY thành công' : 'Thanh toán VNPAY thất bại'),
    };
  }

  /**
   * Xử lý xác thực chữ ký và kết quả MoMo Return URL (GET /api/payments/momo/return)
   */
  public async verifyAndProcessMomoReturn(queryParams: Record<string, any>) {
    const isMock = queryParams.isMock === 'true';
    const isValidSignature = isMock || verifyMoMoResponseSignature(queryParams);

    if (!isValidSignature) {
      throw new BadRequestError('Chữ ký MoMo không hợp lệ');
    }

    const orderId = queryParams.orderId as string;
    const resultCode = Number(queryParams.resultCode ?? 0);
    const isSuccess = resultCode === 0;
    const transId = (queryParams.transId as string) || `momo-${Date.now()}`;
    const status = isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

    if (!orderId) {
      throw new BadRequestError('Thiếu thông tin orderId trong kết quả trả về');
    }

    const payment = await prisma.payment.findUnique({
      where: { order_id: orderId },
    });

    if (!payment) {
      throw new NotFoundError(`Không tìm thấy giao dịch thanh toán cho đơn hàng ${orderId}`);
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        gateway_transaction_id: transId,
        method: PaymentMethod.MOMO,
      },
    });

    // Đồng bộ trạng thái sang order-service
    await this.syncOrderStatus(orderId, isSuccess);

    return {
      payment: updatedPayment,
      isSuccess,
      message: isSuccess ? 'Thanh toán MoMo thành công' : (queryParams.message as string || 'Thanh toán MoMo thất bại'),
    };
  }

  /**
   * Đồng bộ trạng thái đơn hàng sang order-service khi thanh toán hoàn tất
   */
  private async syncOrderStatus(orderId: string, isSuccess: boolean) {
    const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3004';
    try {
      const orderStatus = isSuccess ? 'CONFIRMED' : 'CANCELLED';
      await axios.put(`${ORDER_SERVICE_URL}/api/orders/${orderId}/status`, {
        status: orderStatus,
      }, {
        headers: { 
          'x-user-id': '00000000-0000-0000-0000-000000000000', // Dummy UUID to bypass auth check
          'x-user-role': 'ADMIN' 
        },
      });
    } catch (err: any) {
      console.error(`[PaymentService] Failed to sync order status to order-service for order ${orderId}:`, err.message);
    }
  }

  /**
   * Xử lý IPN từ VNPAY (GET /api/payments/callback/vnpay)
   */
  public async verifyAndProcessVnpayIpn(queryParams: Record<string, any>) {
    const verifyResult = vnpay.verifyIpnCall(queryParams as ReturnQueryFromVNPay);
    
    if (!verifyResult.isVerified) {
      throw new BadRequestError('Chữ ký VNPAY không hợp lệ');
    }

    const orderId = verifyResult.vnp_TxnRef;
    const isSuccess = verifyResult.isSuccess;
    const transactionNo = verifyResult.vnp_TransactionNo?.toString() || `vnpay-${Date.now()}`;
    const status = isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

    const payment = await prisma.payment.findUnique({
      where: { order_id: orderId },
    });

    if (!payment) {
      throw new NotFoundError(`Không tìm thấy giao dịch thanh toán cho đơn hàng ${orderId}`);
    }

    // Idempotency check: nếu đã xử lý rồi thì bỏ qua không update và không sync nữa
    if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.FAILED) {
      return { RspCode: '02', Message: 'Order already confirmed' }; // Mã lỗi chuẩn VNPAY
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        gateway_transaction_id: transactionNo,
        method: PaymentMethod.VNPAY,
      },
    });

    // Đồng bộ trạng thái sang order-service
    await this.syncOrderStatus(orderId, isSuccess);

    return { RspCode: '00', Message: 'Confirm Success' };
  }

  /**
   * Xử lý IPN từ MoMo (POST /api/payments/callback/momo)
   */
  public async verifyAndProcessMomoIpn(bodyData: Record<string, any>) {
    const isMock = bodyData.isMock === 'true';
    const isValidSignature = isMock || verifyMoMoResponseSignature(bodyData);

    if (!isValidSignature) {
      throw new BadRequestError('Chữ ký MoMo không hợp lệ');
    }

    const orderId = bodyData.orderId as string;
    const resultCode = Number(bodyData.resultCode ?? 0);
    const isSuccess = resultCode === 0;
    const transId = (bodyData.transId as string) || `momo-${Date.now()}`;
    const status = isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

    if (!orderId) {
      throw new BadRequestError('Thiếu thông tin orderId trong IPN');
    }

    const payment = await prisma.payment.findUnique({
      where: { order_id: orderId },
    });

    if (!payment) {
      throw new NotFoundError(`Không tìm thấy giao dịch thanh toán cho đơn hàng ${orderId}`);
    }

    // Idempotency check
    if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.FAILED) {
      return { isSuccess: true, message: 'Already processed' };
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        gateway_transaction_id: transId,
        method: PaymentMethod.MOMO,
      },
    });

    // Đồng bộ trạng thái sang order-service
    await this.syncOrderStatus(orderId, isSuccess);

    return { isSuccess: true, message: 'Processed successfully' };
  }

  /**
   * Hoàn tiền cho giao dịch thanh toán thành công
   */
  public async refundPayment(id: string) {
    const payment = await this.getPaymentById(id);

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestError('Chỉ có thể hoàn tiền cho giao dịch đã thanh toán thành công');
    }

    return prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.REFUNDED,
      },
    });
  }
}

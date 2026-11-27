import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { sendResponse } from '../utils/response';
import { serializeDecimal } from '../utils/serializeDecimal';
import { FRONTEND_URL } from '../config/vnpay.config';
import {
  CreatePaymentInput,
  UpdatePaymentStatusInput,
  PaymentMethod,
  PaymentStatus,
} from '../types/payment.types';

const paymentService = new PaymentService();

export class PaymentController {
  /**
   * POST /api/payments/create - Khởi tạo giao dịch thanh toán
   */
  public async createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreatePaymentInput;
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      
      const payment = await paymentService.createPayment({
        ...input,
        client_ip: clientIp,
      });

      sendResponse(
        res,
        201,
        true,
        'Khởi tạo giao dịch thanh toán thành công',
        serializeDecimal(payment)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments/vnpay/return - VNPAY chuyển hướng người dùng về đây sau khi thanh toán
   */
  public async vnpayReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.verifyAndProcessVnpayReturn(req.query);

      const statusParam = result.isSuccess ? 'success' : 'failed';
      const redirectUrl = `${FRONTEND_URL}/payment-result?status=${statusParam}&orderId=${result.payment.order_id}&message=${encodeURIComponent(result.message)}`;
      
      res.redirect(redirectUrl);
    } catch (error: any) {
      const redirectUrl = `${FRONTEND_URL}/payment-result?status=failed&message=${encodeURIComponent(error.message || 'Lỗi xác thực thanh toán VNPAY')}`;
      res.redirect(redirectUrl);
    }
  }

  /**
   * GET /api/payments/:id - Lấy thông tin thanh toán theo Payment ID
   */
  public async getPaymentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await paymentService.getPaymentById(id);

      sendResponse(
        res,
        200,
        true,
        'Lấy chi tiết thanh toán thành công',
        serializeDecimal(payment)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments/order/:orderId - Lấy thông tin thanh toán theo Order ID
   */
  public async getPaymentByOrderId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.params;
      const payment = await paymentService.getPaymentByOrderId(orderId);

      sendResponse(
        res,
        200,
        true,
        `Lấy thông tin thanh toán của đơn hàng ${orderId} thành công`,
        serializeDecimal(payment)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments - Lấy danh sách giao dịch thanh toán
   */
  public async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const status = req.query.status as PaymentStatus | undefined;
      const method = req.query.method as PaymentMethod | undefined;

      const result = await paymentService.getPayments({ page, limit, status, method });

      sendResponse(
        res,
        200,
        true,
        'Lấy danh sách thanh toán thành công',
        serializeDecimal(result)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/payments/:id/status - Cập nhật trạng thái giao dịch thanh toán
   */
  public async updatePaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as UpdatePaymentStatusInput;
      const payment = await paymentService.updatePaymentStatus(id, input);

      sendResponse(
        res,
        200,
        true,
        'Cập nhật trạng thái thanh toán thành công',
        serializeDecimal(payment)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments/callback/vnpay - IPN callback từ VNPAY
   */
  public async vnpayCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.verifyAndProcessVnpayIpn(req.query);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('VNPAY IPN Error:', error.message);
      if (error.message === 'Chữ ký VNPAY không hợp lệ') {
        res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
      } else if (error.message.includes('Không tìm thấy giao dịch')) {
        res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      } else {
        res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
      }
    }
  }

  /**
   * POST /api/payments/:id/refund - Hoàn tiền giao dịch
   */
  public async refundPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await paymentService.refundPayment(id);

      sendResponse(
        res,
        200,
        true,
        'Hoàn tiền giao dịch thành công',
        serializeDecimal(payment)
      );
    } catch (error) {
      next(error);
    }
  }
}

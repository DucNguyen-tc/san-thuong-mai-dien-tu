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
   * GET /api/payments/momo/return - MoMo chuyển hướng người dùng về đây sau khi thanh toán
   */
  public async momoReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.verifyAndProcessMomoReturn(req.query);

      const statusParam = result.isSuccess ? 'success' : 'failed';
      const redirectUrl = `${FRONTEND_URL}/payment-result?status=${statusParam}&orderId=${result.payment.order_id}&message=${encodeURIComponent(result.message)}`;
      
      res.redirect(redirectUrl);
    } catch (error: any) {
      const redirectUrl = `${FRONTEND_URL}/payment-result?status=failed&message=${encodeURIComponent(error.message || 'Lỗi xác thực thanh toán MoMo')}`;
      res.redirect(redirectUrl);
    }
  }

  /**
   * GET /api/payments/momo/simulator - Trang giả lập MoMo dành cho sinh viên test đồ án
   */
  public async momoSimulator(req: Request, res: Response): Promise<void> {
    const { orderId, amount, requestId } = req.query;

    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cổng Thanh Toán MoMo (Mô Phỏng Sandbox)</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; display: flex; justify-content: center; items: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 440px; padding: 32px; text-align: center; }
          .logo { background-color: #a50064; color: white; font-weight: bold; font-size: 24px; padding: 12px 24px; border-radius: 12px; display: inline-block; margin-bottom: 24px; }
          .amount { font-size: 32px; font-weight: bold; color: #a50064; margin: 16px 0; }
          .info-box { background: #fff0f6; border: 1px solid #ffadd2; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: left; font-size: 14px; color: #333; }
          .btn { width: 100%; padding: 14px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: opacity 0.2s; margin-bottom: 12px; }
          .btn-success { background-color: #ae2070; color: white; }
          .btn-success:hover { opacity: 0.9; }
          .btn-cancel { background-color: #e0e0e0; color: #333; }
          .btn-cancel:hover { background-color: #d0d0d0; }
          .badge { background: #e6f7ff; color: #1890ff; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-block; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">MoMo</div>
          <div class="badge">Môi Trường Mô Phỏng Demo Đồ Án</div>
          <h2 style="margin:0 0 8px 0;">Thanh Toán Đơn Hàng</h2>
          <div class="amount">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0)}</div>
          <div class="info-box">
            <div><strong>Mã đơn hàng:</strong> ${orderId}</div>
            <div style="margin-top: 6px;"><strong>Mã giao dịch:</strong> ${requestId}</div>
          </div>
          <a href="/api/payments/momo/return?orderId=${orderId}&resultCode=0&transId=momo-mock-${Date.now()}&isMock=true" style="text-decoration:none;">
            <button class="btn btn-success">✓ Xác Nhận Thanh Toán Thành Công</button>
          </a>
          <a href="/api/payments/momo/return?orderId=${orderId}&resultCode=1006&message=UserCancelled&isMock=true" style="text-decoration:none;">
            <button class="btn btn-cancel">✕ Hủy Giao Dịch</button>
          </a>
        </div>
      </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
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
   * POST /api/payments/callback/momo - Callback từ MOMO
   */
  public async momoCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await paymentService.verifyAndProcessMomoIpn(req.body);
      res.status(204).send(); // MoMo expects 204 No Content
    } catch (error: any) {
      console.error('MOMO IPN Error:', error.message);
      res.status(400).json({ success: false, message: 'Invalid IPN request' });
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

import { Request, Response } from 'express';

/**
 * PaymentController — Xử lý các HTTP Request rỗng cho Thanh toán
 */
export class PaymentController {

  // POST /api/payments/create
  public async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const { order_id, amount, method } = req.body;
      
      let paymentUrl: string | null = null;
      if (method === 'VNPAY') {
        paymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?order_id=${order_id}&amount=${amount}`;
      } else if (method === 'MOMO') {
        paymentUrl = `https://test-payment.momo.vn/pay/qr?order_id=${order_id}&amount=${amount}`;
      }

      res.status(201).json({
        success: true,
        message: 'Khởi tạo giao dịch thanh toán thành công (Mock)',
        data: {
          id: 'mock-payment-uuid',
          order_id,
          amount,
          method,
          status: 'PENDING',
          gateway_transaction_id: null,
          payment_url: paymentUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi máy chủ', error });
    }
  }

  // POST /api/payments/callback/vnpay
  public async vnpayCallback(req: Request, res: Response): Promise<void> {
    try {
      const callbackData = req.body;
      res.status(200).json({
        success: true,
        message: 'Xử lý callback VNPAY thành công (Mock)',
        data: {
          gateway: 'VNPAY',
          status: 'SUCCESS',
          gateway_transaction_id: callbackData.vnp_TransactionNo || 'mock-vnpay-trans-123',
          amount: callbackData.vnp_Amount ? parseInt(callbackData.vnp_Amount, 10) / 100 : 330000
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi máy chủ', error });
    }
  }

  // POST /api/payments/callback/momo
  public async momoCallback(req: Request, res: Response): Promise<void> {
    try {
      const callbackData = req.body;
      res.status(200).json({
        success: true,
        message: 'Xử lý callback MOMO thành công (Mock)',
        data: {
          gateway: 'MOMO',
          status: 'SUCCESS',
          gateway_transaction_id: callbackData.transId || 'mock-momo-trans-456',
          amount: callbackData.amount || 215000
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi máy chủ', error });
    }
  }

  // GET /api/payments/order/:orderId
  public async getPaymentByOrderId(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      res.status(200).json({
        success: true,
        message: `Lấy thông tin thanh toán của đơn hàng ${orderId} thành công (Mock)`,
        data: {
          id: 'mock-payment-uuid',
          order_id: orderId,
          amount: 330000,
          method: 'VNPAY',
          status: 'SUCCESS',
          gateway_transaction_id: 'mock-vnpay-trans-123',
          payment_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi máy chủ', error });
    }
  }
}

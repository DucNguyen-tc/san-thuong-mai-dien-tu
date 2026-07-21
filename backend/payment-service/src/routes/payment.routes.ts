import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();
const paymentController = new PaymentController();

// POST /api/payments/create - Khởi tạo giao dịch thanh toán
router.post('/create', paymentController.createPayment.bind(paymentController));

// POST /api/payments/callback/vnpay - IPN/Callback từ VNPAY
router.post('/callback/vnpay', paymentController.vnpayCallback.bind(paymentController));

// POST /api/payments/callback/momo - IPN/Callback từ MOMO
router.post('/callback/momo', paymentController.momoCallback.bind(paymentController));

// GET /api/payments/order/:orderId - Lấy thông tin thanh toán của đơn hàng
router.get('/order/:orderId', paymentController.getPaymentByOrderId.bind(paymentController));

export default router;

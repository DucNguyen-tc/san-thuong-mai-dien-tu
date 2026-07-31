import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { validateBody, validateParams } from '../middlewares/validate';
import {
  createPaymentSchema,
  updatePaymentStatusSchema,
  paymentIdParamSchema,
  orderIdParamSchema,
} from '../schemas/payment.schema';

const router = Router();
const paymentController = new PaymentController();

// POST /api/payments/create - Khởi tạo giao dịch thanh toán
router.post(
  '/create',
  validateBody(createPaymentSchema),
  paymentController.createPayment.bind(paymentController)
);

// GET /api/payments - Lấy danh sách thanh toán (cho Admin/Quản lý)
router.get('/', paymentController.getPayments.bind(paymentController));

// GET /api/payments/vnpay/return - VNPAY Return URL (xử lý kết quả & redirect Option A)
router.get('/vnpay/return', paymentController.vnpayReturn.bind(paymentController));

// GET /api/payments/momo/return - MoMo Return URL (xử lý kết quả & redirect Option A)
router.get('/momo/return', paymentController.momoReturn.bind(paymentController));

// GET /api/payments/momo/simulator - Trang giả lập MoMo dành cho sinh viên test đồ án
router.get('/momo/simulator', paymentController.momoSimulator.bind(paymentController));

// GET /api/payments/order/:orderId - Lấy thông tin thanh toán của đơn hàng
router.get(
  '/order/:orderId',
  validateParams(orderIdParamSchema),
  paymentController.getPaymentByOrderId.bind(paymentController)
);

// GET /api/payments/:id - Lấy thông tin thanh toán theo ID
router.get(
  '/:id',
  validateParams(paymentIdParamSchema),
  paymentController.getPaymentById.bind(paymentController)
);

// PUT /api/payments/:id/status - Cập nhật trạng thái giao dịch
router.put(
  '/:id/status',
  validateParams(paymentIdParamSchema),
  validateBody(updatePaymentStatusSchema),
  paymentController.updatePaymentStatus.bind(paymentController)
);

// GET /api/payments/callback/vnpay - IPN/Callback từ VNPAY
router.get('/callback/vnpay', paymentController.vnpayCallback.bind(paymentController));

// POST /api/payments/callback/momo - IPN/Callback từ MOMO
router.post('/callback/momo', paymentController.momoCallback.bind(paymentController));

// POST /api/payments/:id/refund - Hoàn tiền giao dịch
router.post(
  '/:id/refund',
  validateParams(paymentIdParamSchema),
  paymentController.refundPayment.bind(paymentController)
);

export default router;

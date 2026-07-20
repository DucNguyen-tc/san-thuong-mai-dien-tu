import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { validateBody } from '../middlewares/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../schemas/order.schema';

const router = Router();
const orderController = new OrderController();

// POST /api/orders - Tạo đơn hàng mới
router.post(
  '/',
  validateBody(createOrderSchema),
  orderController.createOrder.bind(orderController)
);

// GET /api/orders - Lấy danh sách đơn hàng
router.get('/', orderController.getOrders.bind(orderController));

// GET /api/orders/:id - Xem chi tiết đơn hàng
router.get('/:id', orderController.getOrderById.bind(orderController));

// PUT /api/orders/:id/status - Cập nhật trạng thái đơn hàng (Admin/System)
router.put(
  '/:id/status',
  validateBody(updateOrderStatusSchema),
  orderController.updateOrderStatus.bind(orderController)
);

// POST /api/orders/:id/cancel - Hủy đơn hàng
router.post('/:id/cancel', orderController.cancelOrder.bind(orderController));

export default router;

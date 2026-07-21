import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';
import { validateBody } from '../middlewares/validate';
import { addItemSchema, updateItemSchema } from '../schemas/cart.schema';

const router = Router();
const cartController = new CartController();

// GET /api/cart - Lấy giỏ hàng
router.get('/', cartController.getCart.bind(cartController));

// POST /api/cart/items - Thêm sản phẩm vào giỏ
router.post(
  '/items',
  validateBody(addItemSchema),
  cartController.addItem.bind(cartController)
);

// PUT /api/cart/items/:id - Cập nhật số lượng của một item
router.put(
  '/items/:id',
  validateBody(updateItemSchema),
  cartController.updateItem.bind(cartController)
);

// DELETE /api/cart/items/:id - Xóa một item khỏi giỏ
router.delete('/items/:id', cartController.removeItem.bind(cartController));

// DELETE /api/cart - Làm trống giỏ hàng
router.delete('/', cartController.clearCart.bind(cartController));

export default router;

import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';

const router = Router();
const cartController = new CartController();

// GET /api/cart - Lấy giỏ hàng
router.get('/', cartController.getCart.bind(cartController));

// POST /api/cart/items - Thêm sản phẩm vào giỏ
router.post('/items', cartController.addItem.bind(cartController));

// PUT /api/cart/items/:id - Cập nhật số lượng của một item
router.put('/items/:id', cartController.updateItem.bind(cartController));

// DELETE /api/cart/items/:id - Xóa một item khỏi giỏ
router.delete('/items/:id', cartController.removeItem.bind(cartController));

// DELETE /api/cart - Làm trống giỏ hàng
router.delete('/', cartController.clearCart.bind(cartController));

export default router;

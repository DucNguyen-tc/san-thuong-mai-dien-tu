import { Router } from 'express';
import cartRoutes from './cart.routes';

const router = Router();

// Gắn prefix cho các route giỏ hàng
router.use('/cart', cartRoutes);

export default router;

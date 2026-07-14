import { Router } from 'express';
import orderRoutes from './order.routes';

const router = Router();

// Gắn prefix cho các route đơn hàng
router.use('/orders', orderRoutes);

export default router;

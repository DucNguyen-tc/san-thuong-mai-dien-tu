import { Router } from 'express';
import orderRoutes from './order.routes';
import telegramRoutes from './telegram.routes';

const router = Router();

// Gắn prefix cho các route đơn hàng
router.use('/orders', orderRoutes);

// Gắn prefix cho các route quản trị Telegram Bot & Báo cáo
router.use('/telegram', telegramRoutes);

export default router;


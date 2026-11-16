import { Router } from 'express';
import paymentRoutes from './payment.routes';

const router = Router();

// Gắn prefix cho các route thanh toán
router.use('/payments', paymentRoutes);

export default router;

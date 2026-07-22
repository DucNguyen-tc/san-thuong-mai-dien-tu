import { Router } from 'express';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import variantRoutes from './variant.routes';
import promotionRoutes from './promotion.routes';
import uploadRoutes from './upload.routes';
import productImageRoutes from './product-image.routes';
import promotionItemRoutes from './promotion-item.routes';
import stockReservationRoutes from './stock-reservation.routes';

const router = Router();

// Mount các router con
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/variants', variantRoutes);
router.use('/promotions', promotionRoutes);
router.use('/upload', uploadRoutes);

// Mount 3 routes mới
router.use('/images', productImageRoutes);
router.use('/promotions/:promotionId/items', promotionItemRoutes);
router.use('/stock-reservations', stockReservationRoutes);

export default router;

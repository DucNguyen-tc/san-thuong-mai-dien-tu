import { Router } from 'express';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import variantRoutes from './variant.routes';

const router = Router();

router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/variants', variantRoutes);

export default router;

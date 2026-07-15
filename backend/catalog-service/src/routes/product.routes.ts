import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariant,
  deleteVariant,
} from '../controllers/product.controller';
import { validateBody } from '../middlewares/validate';
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
} from '../schemas/product.schema';

// TODO (tuần 2+): gắn middleware verifyToken + requireRole('ADMIN') của Identity Service
// cho các route create/update/delete bên dưới.

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', validateBody(createProductSchema), createProduct);
router.put('/:id', validateBody(updateProductSchema), updateProduct);
router.delete('/:id', deleteProduct);

router.post('/:id/variants', validateBody(createVariantSchema), addVariant);
router.put('/variants/:variantId', validateBody(updateVariantSchema), updateVariant);
router.delete('/variants/:variantId', deleteVariant);

export default router;

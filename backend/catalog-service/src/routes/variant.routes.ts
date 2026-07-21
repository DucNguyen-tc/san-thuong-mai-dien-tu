import { Router } from 'express';
import {
  getVariants,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant,
  getBulk,
  updateStock,
} from '../controllers/variant.controller';
import { validateBody } from '../middlewares/validate';
import { createVariantSchema, updateVariantSchema } from '../schemas/variant.schema';

const router = Router();

router.get('/', getVariants);
router.post('/bulk', getBulk); // API để Cart Service lấy nhiều variants
router.put('/stock', updateStock); // API để Order Service cập nhật tồn kho
router.get('/:id', getVariantById);
router.post('/', validateBody(createVariantSchema), createVariant);
router.put('/:id', validateBody(updateVariantSchema), updateVariant);
router.delete('/:id', deleteVariant);

export default router;

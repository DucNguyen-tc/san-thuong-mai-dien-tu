import { Router } from 'express';
import {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  addItemToPromotion,
  addItemsByCategory,
} from '../controllers/promotion.controller';
import { validateBody } from '../middlewares/validate';
import { createPromotionSchema, updatePromotionSchema } from '../schemas/promotion.schema';

const router = Router();

router.get('/', getPromotions);
router.get('/:id', getPromotionById);
router.post('/', validateBody(createPromotionSchema), createPromotion);
router.put('/:id', validateBody(updatePromotionSchema), updatePromotion);
router.delete('/:id', deletePromotion);

router.post('/:id/items', addItemToPromotion);
router.post('/:id/items/category', addItemsByCategory);

export default router;

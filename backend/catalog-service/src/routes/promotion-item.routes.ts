import { Router } from 'express';
import { getItemsByPromotion, addItem, deleteItem } from '../controllers/promotion-item.controller';
import { validateBody } from '../middlewares/validate';
import { createPromotionItemSchema } from '../schemas/promotion-item.schema';

const router = Router({ mergeParams: true });

// Route này sẽ được mount vào /api/catalog/promotions/:promotionId/items
router.get('/', getItemsByPromotion);
router.post('/', validateBody(createPromotionItemSchema), addItem);
router.delete('/:id', deleteItem); // Xóa theo ID của promotion_items bảng

export default router;

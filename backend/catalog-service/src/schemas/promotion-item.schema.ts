import { z } from 'zod';

export const createPromotionItemSchema = z.object({
  promotion_id: z.string().uuid('ID khuyến mãi không hợp lệ'),
  product_id: z.string().uuid('ID sản phẩm không hợp lệ').nullable().optional(),
  variant_id: z.string().uuid('ID biến thể không hợp lệ').nullable().optional(),
}).refine(data => data.product_id || data.variant_id, {
  message: 'Phải cung cấp product_id hoặc variant_id',
  path: ['product_id'],
});

export type CreatePromotionItemInput = z.infer<typeof createPromotionItemSchema>;

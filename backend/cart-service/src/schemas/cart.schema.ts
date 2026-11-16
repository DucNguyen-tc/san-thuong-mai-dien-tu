import { z } from 'zod';

export const addItemSchema = z.object({
  product_id: z.string().uuid('product_id phải là UUID'),
  variant_id: z.string().uuid('variant_id phải là UUID'),
  quantity: z.number().int().min(1, 'Số lượng phải lớn hơn 0'),
});

export const updateItemSchema = z.object({
  quantity: z.number().int().min(1, 'Số lượng phải lớn hơn 0'),
});

export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

import { z } from 'zod';

export const imageInputSchema = z.object({
  url: z.string().url('URL ảnh không hợp lệ'),
  is_primary: z.boolean().default(false),
  sort_order: z.number().int().nonnegative().default(0),
});

export const variantInputSchema = z.object({
  attributes: z.record(z.string(), z.string()).default({}), // vd: { color: "Đỏ", size: "M" }
  price: z.number().positive('Giá phải lớn hơn 0'),
  stock_quantity: z.number().int().nonnegative().default(0),
  is_active: z.boolean().default(true),
  images: z.array(imageInputSchema).optional(),
});

export const createVariantSchema = variantInputSchema.extend({
  product_id: z.string().uuid('product_id phải là UUID hợp lệ'),
});

export const updateVariantSchema = z.object({
  attributes: z.record(z.string(), z.string()).optional(),
  price: z.number().positive('Giá phải lớn hơn 0').optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
  images: z.array(imageInputSchema).optional(),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;


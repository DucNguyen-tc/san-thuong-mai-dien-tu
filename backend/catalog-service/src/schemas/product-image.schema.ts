import { z } from 'zod';

export const createProductImageSchema = z.object({
  product_id: z.string().uuid('ID sản phẩm không hợp lệ'),
  variant_id: z.string().uuid('ID biến thể không hợp lệ').optional(),
  url: z.string().url('URL ảnh không hợp lệ'),
  is_primary: z.boolean().optional().default(false),
  sort_order: z.number().int().min(0).optional().default(0),
});

export const updateProductImageSchema = z.object({
  is_primary: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type CreateProductImageInput = z.infer<typeof createProductImageSchema>;
export type UpdateProductImageInput = z.infer<typeof updateProductImageSchema>;

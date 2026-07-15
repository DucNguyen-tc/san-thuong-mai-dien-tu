import { z } from 'zod';

export const variantInputSchema = z.object({
  attributes: z.record(z.string(), z.string()).default({}), // vd: { color: "Đỏ", size: "M" }
  price: z.number().positive('Giá phải lớn hơn 0'),
  stock_quantity: z.number().int().nonnegative().default(0),
  is_active: z.boolean().default(true),
});

export const imageInputSchema = z.object({
  url: z.string().url('URL ảnh không hợp lệ'),
  is_primary: z.boolean().default(false),
  sort_order: z.number().int().nonnegative().default(0),
});

export const createProductSchema = z.object({
  category_id: z.string().uuid('category_id phải là UUID hợp lệ'),
  name: z.string().trim().min(2, 'Tên sản phẩm tối thiểu 2 ký tự').max(255),
  description: z.string().trim().min(1, 'Mô tả sản phẩm không được để trống'),
  is_active: z.boolean().default(true),
  variants: z.array(variantInputSchema).min(1, 'Sản phẩm cần ít nhất 1 biến thể (giá/tồn kho)'),
  images: z.array(imageInputSchema).optional().default([]),
});

export const updateProductSchema = z.object({
  category_id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(255).optional(),
  description: z.string().trim().min(1).optional(),
  is_active: z.boolean().optional(),
});

export const createVariantSchema = variantInputSchema;

export const updateVariantSchema = z.object({
  attributes: z.record(z.string(), z.string()).optional(),
  price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

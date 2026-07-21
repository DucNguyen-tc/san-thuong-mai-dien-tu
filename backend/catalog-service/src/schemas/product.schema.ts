import { z } from 'zod';
import {
  variantInputSchema,
  createVariantSchema,
  updateVariantSchema,
  CreateVariantInput,
  UpdateVariantInput,
} from './variant.schema';

export {
  variantInputSchema,
  createVariantSchema,
  updateVariantSchema,
  CreateVariantInput,
  UpdateVariantInput,
};

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
  variants: z.array(variantInputSchema).optional(),
  images: z.array(imageInputSchema).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;


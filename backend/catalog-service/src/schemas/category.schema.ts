import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Tên danh mục tối thiểu 2 ký tự').max(150),
  parent_id: z.string().uuid('parent_id phải là UUID hợp lệ').optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  parent_id: z.string().uuid('parent_id phải là UUID hợp lệ').optional().nullable(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

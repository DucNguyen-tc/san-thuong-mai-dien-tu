import { z } from 'zod';

const basePromotionSchema = z.object({
  code: z.string().min(3, 'Mã khuyến mãi phải từ 3 ký tự').max(50, 'Tối đa 50 ký tự'),
  name: z.string().min(3, 'Tên khuyến mãi phải từ 3 ký tự').max(255),
  discount_type: z.enum(['PERCENT', 'FIXED']),
  discount_value: z.number().positive('Giá trị giảm phải lớn hơn 0'),
  min_order_value: z.number().nonnegative().optional().nullable(),
  usage_limit: z.number().int().positive().optional().nullable(),
  valid_from: z.string().datetime({ message: 'Ngày bắt đầu không hợp lệ (ISO 8601)' }),
  valid_to: z.string().datetime({ message: 'Ngày kết thúc không hợp lệ (ISO 8601)' }),
  is_active: z.boolean().optional(),
});

export const createPromotionSchema = basePromotionSchema.refine(data => new Date(data.valid_from) < new Date(data.valid_to), {
  message: 'Ngày kết thúc phải lớn hơn ngày bắt đầu',
  path: ['valid_to'],
});

export const updatePromotionSchema = basePromotionSchema.partial().refine(data => {
  if (data.valid_from && data.valid_to) {
    return new Date(data.valid_from) < new Date(data.valid_to);
  }
  return true;
}, {
  message: 'Ngày kết thúc phải lớn hơn ngày bắt đầu',
  path: ['valid_to'],
});

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;

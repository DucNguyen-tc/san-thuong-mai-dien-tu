import { z } from 'zod';

export const createOrderSchema = z.object({
  shipping_address: z.string().trim().min(5, 'Địa chỉ giao hàng phải có tối thiểu 5 ký tự'),
  payment_method: z.enum(['VNPAY', 'MOMO', 'CASH'], {
    message: 'Phương thức thanh toán phải là VNPAY, MOMO hoặc CASH',
  }),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid('product_id phải là UUID hợp lệ'),
        variant_id: z.string().uuid('variant_id phải là UUID hợp lệ'),
        quantity: z.number().int().min(1, 'Số lượng phải lớn hơn hoặc bằng 1'),
      })
    )
    .optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING_PAYMENT', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'], {
    message: 'Trạng thái đơn hàng không hợp lệ',
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

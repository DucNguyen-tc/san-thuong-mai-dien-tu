import { z } from 'zod';

export const createStockReservationSchema = z.object({
  order_id: z.string().uuid('ID đơn hàng không hợp lệ'),
  variant_id: z.string().uuid('ID biến thể không hợp lệ'),
  quantity: z.number().int().min(1, 'Số lượng phải lớn hơn 0'),
});

export const batchStockReservationSchema = z.object({
  order_id: z.string().uuid('ID đơn hàng không hợp lệ'),
  items: z.array(
    z.object({
      variant_id: z.string().uuid('ID biến thể không hợp lệ'),
      quantity: z.number().int().min(1, 'Số lượng phải lớn hơn 0'),
    })
  ).min(1, 'Danh sách giữ hàng không được rỗng'),
});

export type CreateStockReservationInput = z.infer<typeof createStockReservationSchema>;
export type BatchStockReservationInput = z.infer<typeof batchStockReservationSchema>;


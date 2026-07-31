import { z } from 'zod';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export const createPaymentSchema = z.object({
  order_id: z.string().uuid('order_id phải là định dạng UUID'),
  amount: z.number().positive('Số tiền thanh toán phải lớn hơn 0'),
  method: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Phương thức thanh toán phải là VNPAY, MOMO hoặc CASH' }),
  }),
});

export const updatePaymentStatusSchema = z.object({
  status: z.nativeEnum(PaymentStatus, {
    errorMap: () => ({ message: 'Trạng thái thanh toán phải là PENDING, SUCCESS, FAILED hoặc REFUNDED' }),
  }),
  gateway_transaction_id: z.string().optional(),
  payment_url: z.string().optional(),
});

export const paymentIdParamSchema = z.object({
  id: z.string().uuid('ID thanh toán phải là định dạng UUID'),
});

export const orderIdParamSchema = z.object({
  orderId: z.string().uuid('orderId phải là định dạng UUID'),
});

export type CreatePaymentSchemaInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentStatusSchemaInput = z.infer<typeof updatePaymentStatusSchema>;

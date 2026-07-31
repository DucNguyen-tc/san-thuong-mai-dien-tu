import { PaymentMethod, PaymentStatus } from '@prisma/client';

export { PaymentMethod, PaymentStatus };

export interface CreatePaymentInput {
  order_id: string;
  amount: number;
  method: PaymentMethod;
  client_ip?: string;
}

export interface UpdatePaymentStatusInput {
  status: PaymentStatus;
  gateway_transaction_id?: string;
  payment_url?: string;
}

export interface VnpayCallbackInput {
  vnp_TxnRef?: string;
  vnp_OrderInfo?: string;
  vnp_ResponseCode?: string;
  vnp_TransactionNo?: string;
  vnp_Amount?: string;
  order_id?: string;
  status?: PaymentStatus;
}

export interface MomoCallbackInput {
  orderId?: string;
  requestId?: string;
  amount?: number;
  transId?: string;
  resultCode?: number;
  message?: string;
  status?: PaymentStatus;
}

export interface ListPaymentsQuery {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  method?: PaymentMethod;
}

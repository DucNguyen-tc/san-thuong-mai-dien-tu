import { apiClient } from '@/lib/api-client';

export interface PaymentRecord {
  id: string;
  order_id: string;
  amount: number | string;
  method: 'VNPAY' | 'MOMO' | 'CASH';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  gateway_transaction_id?: string | null;
  payment_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentPayload {
  order_id: string;
  amount: number;
  method: 'VNPAY' | 'MOMO' | 'CASH';
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function createPayment(payload: CreatePaymentPayload): Promise<PaymentRecord> {
  const { data } = await apiClient.post<ApiEnvelope<PaymentRecord>>('/payments/create', payload);
  return data.data;
}

export async function getPaymentByOrderId(orderId: string): Promise<PaymentRecord> {
  const { data } = await apiClient.get<ApiEnvelope<PaymentRecord>>(`/payments/order/${orderId}`);
  return data.data;
}

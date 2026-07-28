import { apiClient } from '@/lib/api-client';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  product_name_snapshot: string;
  variant_attributes_snapshot: Record<string, string>;
  original_unit_price: number | string;
  unit_price_snapshot: number | string;
  quantity: number;
  line_total: number | string;
}

export interface Order {
  id: string;
  customer_id: string;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';
  shipping_address: string;
  payment_method: 'VNPAY' | 'MOMO' | 'CASH';
  subtotal: number | string;
  discount_amount: number | string;
  shipping_fee: number | string;
  total_amount: number | string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface CreateOrderItemInput {
  product_id: string;
  variant_id: string;
  quantity: number;
}

export interface CreateOrderPayload {
  shipping_address: string;
  payment_method: 'VNPAY' | 'MOMO' | 'CASH';
  items?: CreateOrderItemInput[];
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await apiClient.post<ApiEnvelope<Order>>('/orders', payload);
  return data.data;
}

export async function getOrders(params?: { status?: string; page?: number; limit?: number }): Promise<{ items: Order[]; pagination: any }> {
  const { data } = await apiClient.get<ApiEnvelope<{ items: Order[]; pagination: any }>>('/orders', { params });
  return data.data;
}

export async function getOrderById(id: string): Promise<Order> {
  const { data } = await apiClient.get<ApiEnvelope<Order>>(`/orders/${id}`);
  return data.data;
}

export async function cancelOrder(id: string): Promise<Order> {
  const { data } = await apiClient.post<ApiEnvelope<Order>>(`/orders/${id}/cancel`);
  return data.data;
}

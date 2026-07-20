import { apiClient } from '@/lib/api-client';

export interface Promotion {
  id: string;
  code: string;
  name: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  min_order_value?: number;
  usage_limit?: number;
  used_count: number;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  created_at: string;
}

export interface CreatePromotionInput {
  code: string;
  name: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  min_order_value?: number;
  usage_limit?: number;
  valid_from: string;
  valid_to: string;
  is_active?: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getPromotions(): Promise<Promotion[]> {
  const { data } = await apiClient.get<ApiEnvelope<Promotion[]>>('/catalog/promotions');
  return data.data;
}

export async function createPromotion(input: CreatePromotionInput): Promise<Promotion> {
  const { data } = await apiClient.post<ApiEnvelope<Promotion>>('/catalog/promotions', input);
  return data.data;
}

export async function updatePromotion(id: string, input: Partial<CreatePromotionInput>): Promise<Promotion> {
  const { data } = await apiClient.put<ApiEnvelope<Promotion>>(`/catalog/promotions/${id}`, input);
  return data.data;
}

export async function deletePromotion(id: string): Promise<void> {
  await apiClient.delete(`/catalog/promotions/${id}`);
}

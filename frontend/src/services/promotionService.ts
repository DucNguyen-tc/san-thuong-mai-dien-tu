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

export async function getActivePromotions(): Promise<Promotion[]> {
  const promotions = await getPromotions();
  const now = Date.now();
  return (promotions || []).filter((p) => {
    if (!p.is_active) return false;
    const validFrom = new Date(p.valid_from).getTime();
    const validTo = new Date(p.valid_to).getTime();
    return validFrom <= now && validTo > now;
  });
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

export async function addPromotionItem(promotionId: string, productId: string): Promise<any> {
  const { data } = await apiClient.post(`/catalog/promotions/${promotionId}/items`, { product_id: productId });
  return data;
}

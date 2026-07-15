import { apiClient } from '@/lib/api-client';
import type { Category } from '@/types/catalog';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * getCategories — Lấy toàn bộ danh mục (dạng phẳng).
 * Gateway dự kiến route: GET /api/catalog/categories
 */
export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<ApiEnvelope<Category[]>>('/catalog/categories');
  return data.data;
}

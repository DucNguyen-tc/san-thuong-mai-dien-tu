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

export async function getCategoryTree(): Promise<Category[]> {
  const { data } = await apiClient.get<ApiEnvelope<Category[]>>('/catalog/categories/tree');
  return data.data;
}

export async function createCategory(input: any): Promise<Category> {
  const { data } = await apiClient.post<ApiEnvelope<Category>>('/catalog/categories', input);
  return data.data;
}

export async function updateCategory(id: string, input: any): Promise<Category> {
  const { data } = await apiClient.put<ApiEnvelope<Category>>(`/catalog/categories/${id}`, input);
  return data.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/catalog/categories/${id}`);
}

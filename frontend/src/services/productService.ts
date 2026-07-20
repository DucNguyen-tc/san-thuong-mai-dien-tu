import { apiClient } from '@/lib/api-client';
import type { CatalogProduct, ListProductsQuery, ProductListResponse } from '@/types/catalog';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * getProducts — Lấy danh sách sản phẩm có phân trang + lọc.
 * Gateway dự kiến route: GET /api/catalog/products
 */
export async function getProducts(query: ListProductsQuery = {}): Promise<ProductListResponse> {
  const { data } = await apiClient.get<ApiEnvelope<ProductListResponse>>('/catalog/products', {
    params: query,
  });
  return data.data;
}

/**
 * getProductById — Lấy chi tiết 1 sản phẩm (kèm variants + images + category).
 * Gateway dự kiến route: GET /api/catalog/products/:id
 */
export async function getProductById(id: string): Promise<CatalogProduct> {
  const { data } = await apiClient.get<ApiEnvelope<CatalogProduct>>(`/catalog/products/${id}`);
  return data.data;
}

export async function createProduct(input: any): Promise<CatalogProduct> {
  const { data } = await apiClient.post<ApiEnvelope<CatalogProduct>>('/catalog/products', input);
  return data.data;
}

export async function updateProduct(id: string, input: any): Promise<CatalogProduct> {
  const { data } = await apiClient.put<ApiEnvelope<CatalogProduct>>(`/catalog/products/${id}`, input);
  return data.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/catalog/products/${id}`);
}

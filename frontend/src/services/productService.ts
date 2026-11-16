import { apiClient } from '@/lib/api-client';
import type { CatalogProduct, ListProductsQuery, ProductListResponse } from '@/types/catalog';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
 * Hỗ trợ cả UUID lẫn slug (`/product/:slug` từ AI Product Action Cards).
 */
export async function getProductById(idOrSlug: string): Promise<CatalogProduct> {
  if (UUID_REGEX.test(idOrSlug)) {
    const { data } = await apiClient.get<ApiEnvelope<CatalogProduct>>(
      `/catalog/products/${idOrSlug}`
    );
    return data.data;
  }

  // Nếu tham số trên URL là slug (VD: /product/iphone-15-pro-max-256gb)
  return getProductBySlug(idOrSlug);
}

/**
 * getProductBySlug — Tìm sản phẩm theo slug từ Catalog Service
 */
export async function getProductBySlug(slug: string): Promise<CatalogProduct> {
  // Tạo từ khóa tìm kiếm từ slug (bỏ hậu tố số/cat500 nếu có)
  const cleanKeywords = slug
    .replace(/-cat500-\d+$/i, '')
    .replace(/-\d+$/i, '')
    .split('-')
    .filter(Boolean)
    .slice(0, 4)
    .join(' ');

  const list = await getProducts({ search: cleanKeywords, limit: 20 });
  const exactMatch = list.items.find((item) => item.slug === slug);
  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = list.items.find(
    (item) =>
      item.slug.includes(slug) ||
      slug.includes(item.slug.replace(/-cat500-\d+$/i, ''))
  );
  if (partialMatch) {
    return partialMatch;
  }

  if (list.items.length > 0) {
    return list.items[0];
  }

  // Fallback thử gọi trực tiếp endpoint nếu backend hỗ trợ tìm theo slug
  const { data } = await apiClient.get<ApiEnvelope<CatalogProduct>>(
    `/catalog/products/${slug}`
  );
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

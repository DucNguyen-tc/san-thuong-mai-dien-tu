// Types khớp với response thật của catalog-service (không phải mock data)
// Dùng cho: ProductList, ProductDetail, Admin ProductManagement

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  attributes: Record<string, string>; // vd: { color: "Đỏ", size: "M" }
  price: number;
  stock_quantity: number;
  stock_reserved: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id: string | null;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface CatalogProduct {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category: Category;
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListResponse {
  items: CatalogProduct[];
  pagination: Pagination;
}

export interface ListProductsQuery {
  page?: number;
  limit?: number;
  category_id?: string;
  search?: string;
  includeInactive?: boolean;
}

/** Lấy giá thấp nhất trong các biến thể còn bán, dùng hiển thị ở ProductCard */
export function getDisplayPrice(product: CatalogProduct): number {
  if (!product || !Array.isArray(product.variants)) return 0;
  const activePrices = product.variants.filter((v) => v?.is_active).map((v) => Number(v?.price) || 0);
  if (activePrices.length === 0) return 0;
  return Math.min(...activePrices);
}

/** Lấy ảnh đại diện: ưu tiên ảnh is_primary, fallback ảnh đầu tiên, fallback placeholder */
export function getPrimaryImageUrl(product: CatalogProduct): string {
  if (!product || !Array.isArray(product.images) || product.images.length === 0) return 'https://placehold.co/400x400?text=No+Image';
  const primary = product.images.find((img) => img?.is_primary);
  if (primary && primary.url) return primary.url;
  if (product.images[0] && product.images[0].url) return product.images[0].url;
  return 'https://placehold.co/400x400?text=No+Image';
}

/** Tổng tồn kho khả dụng (chưa bị giữ chỗ) trên toàn bộ biến thể */
export function getTotalAvailableStock(product: CatalogProduct): number {
  if (!product || !Array.isArray(product.variants)) return 0;
  return product.variants
    .filter((v) => v?.is_active)
    .reduce((sum, v) => sum + Math.max(0, (Number(v?.stock_quantity) || 0) - (Number(v?.stock_reserved) || 0)), 0);
}

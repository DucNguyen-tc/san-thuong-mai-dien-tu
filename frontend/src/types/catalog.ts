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
}

export interface PromotionItem {
  id: string;
  promotion_id: string;
  product_id?: string;
  variant_id?: string;
  promotion: Promotion;
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
  promotions?: PromotionItem[];
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
  has_discount?: boolean;
  sort?: string;
}

/** Lấy giá thấp nhất trong các biến thể còn bán, dùng hiển thị ở ProductCard */
export function getDisplayPrice(product: CatalogProduct): number {
  if (!product || !Array.isArray(product.variants)) return 0;
  const activePrices = product.variants.filter((v) => v?.is_active).map((v) => Number(v?.price) || 0);
  if (activePrices.length === 0) return 0;
  return Math.min(...activePrices);
}

/** Lấy giá thấp nhất SAU KHI áp dụng khuyến mãi tốt nhất */
export function getDiscountedPrice(product: CatalogProduct): number {
  const basePrice = getDisplayPrice(product);
  if (basePrice === 0) return 0;
  
  if (!product.promotions || product.promotions.length === 0) return basePrice;
  
  let bestPrice = basePrice;
  for (const item of product.promotions) {
    const promo = item.promotion;
    if (promo.discount_type === 'PERCENT') {
      const p = basePrice * (1 - Number(promo.discount_value) / 100);
      if (p < bestPrice) bestPrice = p;
    } else {
      const p = basePrice - Number(promo.discount_value);
      if (p < bestPrice) bestPrice = p;
    }
  }
  
  return Math.max(0, bestPrice);
}

/** Lấy % giảm giá lớn nhất để hiển thị tag giảm giá */
export function getMaxDiscountTag(product: CatalogProduct): string | null {
  if (!product.promotions || product.promotions.length === 0) return null;
  
  const basePrice = getDisplayPrice(product);
  if (basePrice === 0) return null;

  const discounted = getDiscountedPrice(product);
  if (discounted >= basePrice) return null;
  
  const percent = Math.round(((basePrice - discounted) / basePrice) * 100);
  return `-${percent}%`;
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

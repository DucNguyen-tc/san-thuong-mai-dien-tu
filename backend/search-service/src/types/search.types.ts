/**
 * Tham số đầu vào cho API tìm kiếm sản phẩm: GET /api/search/products
 */
export interface SearchParams {
  q?: string;
  page?: number;
  limit?: number;
  category_id?: string;
  price_min?: number;
  price_max?: number;
  color?: string | string[];
  brand?: string | string[];
  has_discount?: boolean;
  sort?: "relevance" | "newest" | "price_asc" | "price_desc";
}

/**
 * Cấu trúc 1 item sản phẩm trả về cho Client
 */
export interface SearchProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_name: string;
  category_slug?: string;
  price: number;
  original_price?: number;
  has_discount: boolean;
  discount_percent: number;
  image_url: string;
  stock_quantity: number;
  score?: number;
  highlight?: {
    name?: string[];
    description?: string[];
  };
}

/**
 * Cấu trúc các bucket Facet
 */
export interface CategoryFacetItem {
  id: string;
  name: string;
  count: number;
}

export interface FacetItem {
  key: string;
  count: number;
}

export interface PriceRangeFacetItem {
  key: string;
  from?: number;
  to?: number;
  count: number;
}

export interface SearchFacets {
  categories: CategoryFacetItem[];
  price_ranges: PriceRangeFacetItem[];
  price_stats: {
    min: number;
    max: number;
  };
  colors: FacetItem[];
  brands: FacetItem[];
  discount_count: number;
}

/**
 * Cấu trúc Response chuẩn cho API Search
 */
export interface SearchResponse {
  items: SearchProductItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  facets: SearchFacets;
}

/**
 * Cấu trúc gợi ý Autocomplete trả về: GET /api/search/suggest
 */
export interface SuggestKeyword {
  text: string;
  highlight?: string;
  score?: number;
}

export interface SuggestResponse {
  keywords: SuggestKeyword[];
  products: Array<{
    id: string;
    name: string;
    slug: string;
    image_url: string;
    price: number;
    discount_percent?: number;
  }>;
}

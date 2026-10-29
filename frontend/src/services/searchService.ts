import { apiClient } from '@/lib/api-client';

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

export interface SearchProductsResponse {
  items: SearchProductItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  facets: SearchFacets;
}

export interface SuggestKeyword {
  text: string;
  highlight?: string;
  score?: number;
}

export interface SuggestProduct {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  price: number;
  discount_percent?: number;
}

export interface SuggestResponse {
  keywords: SuggestKeyword[];
  products: SuggestProduct[];
}

export interface SearchParamsQuery {
  q?: string;
  page?: number;
  limit?: number;
  category_id?: string;
  price_min?: number;
  price_max?: number;
  color?: string;
  brand?: string;
  has_discount?: boolean;
  sort?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Lấy gợi ý từ khóa & top sản phẩm (Autocomplete)
 */
export async function getSuggestions(query: string, limit: number = 5, signal?: AbortSignal): Promise<SuggestResponse> {
  if (!query || !query.trim()) {
    return { keywords: [], products: [] };
  }
  const { data } = await apiClient.get<ApiEnvelope<SuggestResponse>>('/search/suggest', {
    params: { q: query.trim(), limit },
    signal,
  });
  return data.data;
}

/**
 * Tìm kiếm danh sách sản phẩm (Full-text + Facets)
 */
export async function searchProducts(query: SearchParamsQuery, signal?: AbortSignal): Promise<SearchProductsResponse> {
  const { data } = await apiClient.get<ApiEnvelope<SearchProductsResponse>>('/search/products', {
    params: query,
    signal,
  });
  return data.data;
}

export interface VisualSearchResultItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number;
  has_discount: boolean;
  discount_percent: number;
  image_url: string;
  images: string[];
  category_name: string;
  category_slug: string;
  attributes: Record<string, string[]>;
  similarity_score: number;
  similarity_percent: number;
}

export interface VisualSearchResponse {
  items: VisualSearchResultItem[];
  total: number;
  processing_time_ms: number;
}

/**
 * Tìm kiếm sản phẩm bằng hình ảnh (kNN Visual Search)
 */
export async function visualSearch(
  imageInput: File | string,
  limit: number = 12,
  signal?: AbortSignal,
): Promise<VisualSearchResponse> {
  if (typeof imageInput === 'string') {
    const { data } = await apiClient.post<ApiEnvelope<VisualSearchResponse>>(
      '/search/visual',
      { imageUrl: imageInput, limit },
      { signal },
    );
    return data.data;
  } else {
    const formData = new FormData();
    formData.append('image', imageInput);
    formData.append('limit', String(limit));

    const { data } = await apiClient.post<ApiEnvelope<VisualSearchResponse>>(
      '/search/visual',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal,
      },
    );
    return data.data;
  }
}


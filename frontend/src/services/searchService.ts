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
  try {
    const { data } = await apiClient.get<ApiEnvelope<SearchProductsResponse>>('/search/products', {
      params: query,
      signal,
    });
    return data.data;
  } catch (err: any) {
    console.warn('[searchProducts] /search/products không khả dụng, chuyển sang dùng /catalog/products:', err?.message);
    const { data } = await apiClient.get<ApiEnvelope<any>>('/catalog/products', {
      params: {
        search: query.q,
        category_id: query.category_id,
        has_discount: query.has_discount,
        page: query.page || 1,
        limit: query.limit || 12,
        sort: query.sort,
      },
      signal,
    });

    const catalogData = data.data;
    const rawItems: any[] = catalogData?.items || catalogData?.products || [];
    const mappedItems: SearchProductItem[] = rawItems.map((p: any) => {
      const primaryVariant = p.variants?.[0] || null;
      const price = Number(primaryVariant?.price || p.price || 0);
      const originalPrice = primaryVariant?.original_price ? Number(primaryVariant.original_price) : undefined;
      const discountPercent = originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
      const primaryImg = p.images?.find((img: any) => img.is_primary) || p.images?.[0];
      const imageUrl =
        primaryImg?.url ||
        primaryImg?.image_url ||
        p.image_url ||
        p.thumbnail ||
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400';

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description || '',
        category_name: p.category?.name || 'Sản phẩm',
        price,
        original_price: originalPrice,
        has_discount: discountPercent > 0,
        discount_percent: discountPercent,
        image_url: imageUrl,
        stock_quantity: primaryVariant?.stock_quantity ?? 10,
      };
    });

    return {
      items: mappedItems,
      pagination: catalogData?.pagination || { page: 1, limit: 12, total: mappedItems.length, totalPages: 1 },
      facets: {
        categories: [],
        price_ranges: [],
        price_stats: { min: 0, max: 100000000 },
        colors: [],
        brands: [],
        discount_count: 0,
      },
    };
  }
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


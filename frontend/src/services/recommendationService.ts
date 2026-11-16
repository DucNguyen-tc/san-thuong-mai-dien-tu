import { apiClient } from '@/lib/api-client';

interface RecommendationResponse {
  success: boolean;
  data: string[];
  meta?: {
    algorithm: string;
    description?: string;
    count: number;
    source_count?: number;
  };
}

/**
 * Lấy danh sách sản phẩm tương tự (Hybrid: Content-based + Collaborative Filtering)
 * Dùng khi người dùng tập trung vào 1 nhóm sản phẩm.
 */
export async function getSimilarProductIds(productId: string, limit: number = 8): Promise<string[]> {
  const { data } = await apiClient.get<RecommendationResponse>(
    `/recommendations/${productId}?limit=${limit}`
  );
  return data.data || [];
}

/**
 * Lấy danh sách sản phẩm phổ biến nhất (Best Sellers)
 * Dùng cho guest user chưa có lịch sử hành vi.
 */
export async function getPopularProductIds(limit: number = 8): Promise<string[]> {
  const { data } = await apiClient.get<RecommendationResponse>(
    `/recommendations/popular?limit=${limit}`
  );
  return data.data || [];
}

/**
 * Lấy gợi ý tổng hợp từ nhiều sản phẩm nguồn.
 * Dùng khi người dùng có hành vi đa dạng (xem nhiều category khác nhau).
 * Merge và deduplicate recommendations từ tất cả các nguồn.
 */
export async function getBatchRecommendationIds(productIds: string[], limit: number = 8): Promise<string[]> {
  const { data } = await apiClient.post<RecommendationResponse>(
    '/recommendations/batch',
    { productIds, limit }
  );
  return data.data || [];
}

/**
 * Ghi lại hành vi người dùng để cải thiện Collaborative Filtering theo thời gian.
 * Gọi khi: user thấy gợi ý (IMPRESSION), bấm vào (CLICK), hoặc mua hàng (PURCHASE).
 */
export async function logRecommendationInteraction(params: {
  sourceProductId: string;
  recommendedProductId: string;
  eventType: 'IMPRESSION' | 'CLICK' | 'PURCHASE';
  customerId?: string;
  similarityScore?: number;
}): Promise<void> {
  try {
    await apiClient.post('/recommendations/log', params);
  } catch {
    // Log lỗi nhưng không throw để không ảnh hưởng UX
    console.warn('[Recommendation] Failed to log interaction');
  }
}

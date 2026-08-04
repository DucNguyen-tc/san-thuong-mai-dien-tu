import { PrismaClient } from '@prisma/client';
import { generateFeatureVector } from '../utils/tfidf';

const prisma = new PrismaClient();

export class RecommendationService {
  /**
   * Tính toán và cập nhật (hoặc tạo mới) Vector đặc trưng cho một sản phẩm.
   * Sử dụng pgvector để lưu trữ mảng float.
   */
  async updateProductVector(
    productId: string,
    name: string,
    description: string,
    categoryName: string = ''
  ): Promise<void> {
    try {
      const vector = generateFeatureVector(name, description, categoryName);
      const vectorString = `[${vector.join(',')}]`;

      await prisma.$executeRawUnsafe(`
        INSERT INTO product_vectors (product_id, embedding, computed_at)
        VALUES ($1::uuid, $2::vector, NOW())
        ON CONFLICT (product_id) 
        DO UPDATE SET 
          embedding = EXCLUDED.embedding,
          computed_at = NOW();
      `, productId, vectorString);

      console.log(`[RecommendationService] Updated vector for product: ${productId}`);
    } catch (error) {
      console.error(`[RecommendationService] Failed to update vector for ${productId}`, error);
      throw error;
    }
  }

  /**
   * [Content-based Filtering]
   * Tìm Top N sản phẩm tương tự dựa trên Cosine Similarity của vector.
   * Sử dụng toán tử <=> của pgvector để tính khoảng cách cosine trực tiếp trong DB.
   */
  async getContentBasedProducts(productId: string, limit: number = 8): Promise<Array<{ id: string; score: number }>> {
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          product_id,
          1 - (embedding <=> (SELECT embedding FROM product_vectors WHERE product_id = $1::uuid)) AS similarity_score
        FROM product_vectors 
        WHERE product_id != $1::uuid
          AND (SELECT embedding FROM product_vectors WHERE product_id = $1::uuid) IS NOT NULL
        ORDER BY embedding <=> (SELECT embedding FROM product_vectors WHERE product_id = $1::uuid)
        LIMIT $2;
      `, productId, limit);

      return rows.map(row => ({
        id: row.product_id,
        score: parseFloat(row.similarity_score) || 0
      }));
    } catch (error) {
      console.error(`[Content-Based] Failed for product: ${productId}`, error);
      return [];
    }
  }

  /**
   * [Collaborative Filtering - Item-based]
   * Tìm sản phẩm được xem/click cùng nhau bởi nhiều người dùng.
   */
  async getCollaborativeProducts(productId: string, limit: number = 6): Promise<Array<{ id: string; score: number }>> {
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          recommended_product_id AS product_id,
          COUNT(*) AS click_count,
          COUNT(*) * 1.0 / NULLIF((
            SELECT COUNT(*) FROM recommendation_logs 
            WHERE source_product_id = $1::uuid AND event_type = 'CLICK'
          ), 0) AS score
        FROM recommendation_logs
        WHERE source_product_id = $1::uuid
          AND event_type = 'CLICK'
          AND recommended_product_id != $1::uuid
        GROUP BY recommended_product_id
        ORDER BY click_count DESC
        LIMIT $2;
      `, productId, limit);

      if (rows.length === 0) {
        const indirectRows: any[] = await prisma.$queryRawUnsafe(`
          SELECT 
            rl2.recommended_product_id AS product_id,
            COUNT(*) AS co_click_count,
            COUNT(*) * 0.5 AS score
          FROM recommendation_logs rl1
          JOIN recommendation_logs rl2 
            ON rl1.source_product_id = rl2.source_product_id
            AND rl1.event_type = 'CLICK'
            AND rl2.event_type = 'CLICK'
          WHERE rl1.recommended_product_id = $1::uuid
            AND rl2.recommended_product_id != $1::uuid
          GROUP BY rl2.recommended_product_id
          ORDER BY co_click_count DESC
          LIMIT $2;
        `, productId, limit);

        return indirectRows.map(row => ({
          id: row.product_id,
          score: parseFloat(row.score) || 0.1
        }));
      }

      return rows.map(row => ({
        id: row.product_id,
        score: parseFloat(row.score) || 0.1
      }));
    } catch (error) {
      console.error(`[Collaborative] Failed for product: ${productId}`, error);
      return [];
    }
  }

  /**
   * [Hybrid Recommendation]
   * Kết hợp Content-based (60%) + Collaborative Filtering (40%).
   * Sản phẩm xuất hiện ở cả 2 nguồn sẽ có score cao nhất.
   */
  async getHybridRecommendations(productId: string, limit: number = 8): Promise<string[]> {
    try {
      const [contentBased, collaborative] = await Promise.all([
        this.getContentBasedProducts(productId, limit + 3),
        this.getCollaborativeProducts(productId, limit)
      ]);

      const scoreMap = new Map<string, number>();

      for (const item of contentBased) {
        const current = scoreMap.get(item.id) || 0;
        scoreMap.set(item.id, current + item.score * 0.6);
      }

      for (const item of collaborative) {
        const current = scoreMap.get(item.id) || 0;
        scoreMap.set(item.id, current + item.score * 0.4);
      }

      const sorted = Array.from(scoreMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      console.log(`[Hybrid] Product ${productId}: Content=${contentBased.length}, CF=${collaborative.length}, Merged=${sorted.length}`);
      return sorted;
    } catch (error) {
      console.error(`[Hybrid] Failed for product: ${productId}`, error);
      return [];
    }
  }

  /**
   * Lấy top sản phẩm phổ biến nhất (được click nhiều nhất) để hiển thị ở trang chủ.
   * Dùng cho section "Sản phẩm bán chạy" khi user chưa có lịch sử.
   */
  async getPopularProducts(limit: number = 8): Promise<string[]> {
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          recommended_product_id AS product_id,
          COUNT(*) AS total_interactions
        FROM recommendation_logs
        WHERE event_type IN ('CLICK', 'PURCHASE')
        GROUP BY recommended_product_id
        ORDER BY total_interactions DESC
        LIMIT $1;
      `, limit);

      // Nếu chưa có dữ liệu hành vi, fallback về sản phẩm có vector mới nhất
      if (rows.length < limit) {
        const vectorRows: any[] = await prisma.$queryRawUnsafe(`
          SELECT product_id 
          FROM product_vectors
          ORDER BY computed_at DESC
          LIMIT $1;
        `, limit);

        const existingIds = new Set(rows.map((r: any) => r.product_id));
        const fallbackIds = vectorRows
          .map((r: any) => r.product_id)
          .filter(id => !existingIds.has(id));

        const allIds = [...rows.map((r: any) => r.product_id), ...fallbackIds];
        return allIds.slice(0, limit);
      }

      return rows.map(row => row.product_id);
    } catch (error) {
      console.error('[Popular] Failed to fetch popular products', error);
      return [];
    }
  }

  /**
   * [Batch Recommendation]
   * Lấy gợi ý tổng hợp từ nhiều sản phẩm nguồn.
   * Dùng cho trường hợp hành vi đa dạng: merge kết quả từ top-N sp gần nhất.
   * Mỗi nguồn đóng góp ngang nhau theo rank, loại bỏ trùng lặp và sp nguồn chính.
   */
  async getBatchRecommendations(productIds: string[], limit: number = 8): Promise<string[]> {
    try {
      const uniqueSourceIds = [...new Set(productIds)].slice(0, 5); // Tối đa 5 nguồn

      // Chạy song song recommendations cho từng sp nguồn
      const results = await Promise.all(
        uniqueSourceIds.map(id => this.getHybridRecommendations(id, limit).catch(() => [] as string[]))
      );

      // Score map: id xuất hiện sớm hơn trong kết quả có score cao hơn (rank-based scoring)
      const scoreMap = new Map<string, number>();
      const sourceIdSet = new Set(uniqueSourceIds);

      for (const recList of results) {
        recList.forEach((id, rank) => {
          if (sourceIdSet.has(id)) return; // Bỏ qua các sp nguồn chính
          const rankScore = 1 / (rank + 1); // Higher rank = higher score
          const current = scoreMap.get(id) || 0;
          scoreMap.set(id, current + rankScore);
        });
      }

      const sorted = Array.from(scoreMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      console.log(`[BatchRec] Sources=${uniqueSourceIds.length}, Merged=${sorted.length} results`);
      return sorted;
    } catch (error) {
      console.error('[BatchRec] Failed', error);
      return [];
    }
  }

  /**
   * Lưu log hành vi người dùng (Impression, Click, Purchase) để đo lường
   * và cung cấp dữ liệu cho Collaborative Filtering.
   */
  async logInteraction(
    sourceProductId: string,
    recommendedProductId: string,
    eventType: 'IMPRESSION' | 'CLICK' | 'PURCHASE',
    customerId?: string,
    similarityScore?: number
  ) {
    try {
      await prisma.recommendationLog.create({
        data: {
          source_product_id: sourceProductId,
          recommended_product_id: recommendedProductId,
          event_type: eventType,
          customer_id: customerId || null,
          similarity_score: similarityScore || null
        }
      });
    } catch (error) {
      console.error('[RecommendationService] Failed to log interaction', error);
    }
  }
}

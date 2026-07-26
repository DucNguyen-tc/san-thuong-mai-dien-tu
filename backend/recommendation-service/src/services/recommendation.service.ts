import { PrismaClient } from '@prisma/client';
import { generateFeatureVector } from '../utils/tfidf';

const prisma = new PrismaClient();

export class RecommendationService {
  /**
   * Tính toán và cập nhật (hoặc tạo mới) Vector đặc trưng cho một sản phẩm.
   * Sử dụng pgvector để lưu trữ mảng float 500 chiều.
   */
  async updateProductVector(
    productId: string,
    name: string,
    description: string,
    categoryName: string = ''
  ): Promise<void> {
    try {
      // 1. Tính toán vector bằng thuật toán TF-IDF / Hashing
      const vector = generateFeatureVector(name, description, categoryName);
      
      // Chuyển mảng number[] thành chuỗi format vector của PostgreSQL: '[0.1, 0.2, ...]'
      const vectorString = `[${vector.join(',')}]`;

      // 2. Lưu vào database sử dụng Raw SQL (Prisma không hỗ trợ native cho pgvector type insert)
      // Sử dụng ON CONFLICT để cập nhật nếu đã tồn tại.
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
   * Tìm Top N sản phẩm tương tự dựa trên khoảng cách Cosine (Cosine Similarity).
   * Sử dụng toán tử <=> của pgvector để tính khoảng cách cosine trực tiếp trong DB.
   */
  async getSimilarProducts(productId: string, limit: number = 5): Promise<string[]> {
    try {
      // Tìm các sản phẩm có khoảng cách Cosine nhỏ nhất (càng nhỏ càng giống)
      // Loại trừ chính sản phẩm đang truy vấn.
      const similarProducts: any[] = await prisma.$queryRawUnsafe(`
        SELECT product_id 
        FROM product_vectors 
        WHERE product_id != $1::uuid
        ORDER BY embedding <=> (SELECT embedding FROM product_vectors WHERE product_id = $1::uuid)
        LIMIT $2;
      `, productId, limit);

      return similarProducts.map(row => row.product_id);
    } catch (error) {
      console.error(`[RecommendationService] Failed to fetch similar products for ${productId}`, error);
      // Nếu có lỗi (chưa có vector, DB lỗi, etc.), trả về mảng rỗng để không crash Frontend.
      return [];
    }
  }

  /**
   * Lưu log hành vi người dùng (Impression, Click, Purchase) để đo lường
   */
  async logInteraction(
    sourceProductId: string, 
    recommendedProductId: string, 
    eventType: 'IMPRESSION' | 'CLICK' | 'PURCHASE', 
    customerId?: string
  ) {
    try {
      // Tính lại điểm số tương đồng lúc đó để lưu log (Optional)
      // Trong thực tế, điểm này có thể được truyền từ frontend lên. 
      // Ở đây chúng ta chỉ lưu basic info.
      await prisma.recommendationLog.create({
        data: {
          source_product_id: sourceProductId,
          recommended_product_id: recommendedProductId,
          event_type: eventType,
          customer_id: customerId || null
        }
      });
    } catch (error) {
      console.error('[RecommendationService] Failed to log interaction', error);
    }
  }
}

import { PrismaClient } from "@prisma/client";
import { generateFeatureVector } from "../utils/tfidf";

const prisma = new PrismaClient();

// ── Hằng số cấu hình ──────────────────────────────────────────────────────────
/** Danh mục FMCG được phép mua lại ngay (sau này điền UUID vào) */
const REPURCHASE_ALLOWED_CATEGORY_IDS: string[] = [];

/** Time window phổ biến (ngày) */
const POPULAR_DAYS_WINDOW = 7;

/** Suppression: ẩn sản phẩm đã mua trong N ngày */
const REPURCHASE_SUPPRESS_DAYS = 30;

/** Suppression: ẩn sản phẩm có IMPRESSION > N lần mà không CLICK */
const MAX_IMPRESSIONS_NO_CLICK = 10;

/** Trọng số sự kiện khi tổng hợp user vector */
const EVENT_WEIGHTS = {
  PURCHASE: 3.0,
  ADD_TO_CART: 2.0,
  VIEW: 1.0,
} as const;

/** Cache kết quả Order Service theo customerId (TTL 60 giây) */
const purchasedProductsCache = new Map<
  string,
  { ids: string[]; expiry: number }
>();

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://localhost:3004";
const CATALOG_SERVICE_URL =
  process.env.CATALOG_SERVICE_URL || "http://localhost:3002";
const FETCH_TIMEOUT_MS = 3000;

// ── Helper: fetch với timeout ─────────────────────────────────────────────────
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

export class RecommendationService {
  // ── Ghi sự kiện người dùng (VIEW, ADD_TO_CART) ───────────────────────────
  /**
   * Ghi hành vi người dùng vào bảng user_product_events.
   * Chỉ nhận VIEW và ADD_TO_CART — PURCHASE được lấy trực tiếp từ Order Service.
   */
  async recordUserEvent(
    customerId: string,
    productId: string,
    eventType: "VIEW" | "ADD_TO_CART",
  ): Promise<void> {
    try {
      await prisma.userProductEvent.create({
        data: {
          customer_id: customerId,
          product_id: productId,
          event_type: eventType,
        },
      });
    } catch (error) {
      console.error(
        `[RecommendationService] Failed to record user event ${eventType}`,
        error,
      );
      // Không throw — lỗi ghi event không được làm hỏng UX
    }
  }

  // ── Lấy sản phẩm đã mua trong 30 ngày từ Order Service ───────────────────
  /**
   * Gọi Order Service để lấy productIds đã mua trong 30 ngày.
   * Cache 60 giây theo customerId. Khi lỗi trả về [].
   */
  private async getPurchasedProductIds(
    customerId: string,
  ): Promise<string[]> {
    const now = Date.now();
    const cached = purchasedProductsCache.get(customerId);
    if (cached && cached.expiry > now) {
      return cached.ids;
    }

    try {
      // Dùng limit=100 (max của order-service) để giảm khả năng sót đơn trong 30 ngày.
      // Order-service trả đơn theo thứ tự created_at DESC → 100 đơn gần nhất bao phủ 30 ngày
      // với hầu hết người dùng thông thường.
      const res = await fetchWithTimeout(
        `${ORDER_SERVICE_URL}/api/orders?limit=100`,
        { headers: { "x-user-id": customerId, "x-user-role": "USER" } },
      );

      if (!res.ok) {
        console.warn(
          `[RecommendationService] Order Service returned ${res.status} for customerId ${customerId}`,
        );
        return [];
      }

      const data: any = await res.json();
      const orders: any[] = data?.data?.items || [];

      const cutoff = new Date(
        Date.now() - REPURCHASE_SUPPRESS_DAYS * 24 * 60 * 60 * 1000,
      );

      const productIds = new Set<string>();
      for (const order of orders) {
        if (!order.items) continue;
        const orderDate = new Date(order.created_at);
        if (orderDate < cutoff) continue;

        for (const item of order.items) {
          const pid: string = item.product_id;

          // TODO: Bỏ qua suppress nếu sản phẩm thuộc danh mục FMCG.
          // REPURCHASE_ALLOWED_CATEGORY_IDS hiện rỗng — điền UUID category FMCG vào sau.
          // Order item chưa có category_id_snapshot nên chưa thể lọc tại đây.
          productIds.add(pid);
        }
      }

      const ids = Array.from(productIds);
      purchasedProductsCache.set(customerId, { ids, expiry: now + 60_000 });
      return ids;
    } catch (error: any) {
      console.warn(
        `[RecommendationService] Failed to fetch purchased products: ${error.message}`,
      );
      return [];
    }
  }

  // ── Lấy sản phẩm có IMPRESSION > 10 mà không CLICK ───────────────────────
  private async getHighImpressionNoClickIds(
    customerId?: string,
  ): Promise<string[]> {
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `
        SELECT recommended_product_id AS product_id
        FROM recommendation_logs
        WHERE event_type = 'IMPRESSION'
          ${customerId ? "AND customer_id = $1::uuid" : ""}
        GROUP BY recommended_product_id
        HAVING COUNT(*) > ${MAX_IMPRESSIONS_NO_CLICK}
          AND SUM(CASE WHEN event_type = 'CLICK' THEN 1 ELSE 0 END) = 0
        LIMIT 100;
      `,
        ...(customerId ? [customerId] : []),
      );
      return rows.map((r) => r.product_id);
    } catch {
      return [];
    }
  }

  /**
   * Tính toán và cập nhật (hoặc tạo mới) Vector đặc trưng cho một sản phẩm.
   * Sử dụng pgvector để lưu trữ mảng float.
   */
  async updateProductVector(
    productId: string,
    name: string,
    description: string,
    categoryName: string = "",
  ): Promise<void> {
    try {
      const vector = generateFeatureVector(name, description, categoryName);
      const vectorString = `[${vector.join(",")}]`;

      await prisma.$executeRawUnsafe(
        `
        INSERT INTO product_vectors (product_id, embedding, computed_at)
        VALUES ($1::uuid, $2::vector, NOW())
        ON CONFLICT (product_id) 
        DO UPDATE SET 
          embedding = EXCLUDED.embedding,
          computed_at = NOW();
      `,
        productId,
        vectorString,
      );

      console.log(
        `[RecommendationService] Updated vector for product: ${productId}`,
      );
    } catch (error) {
      console.error(
        `[RecommendationService] Failed to update vector for ${productId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * [Content-based Filtering]
   * Tìm Top N sản phẩm tương tự dựa trên Cosine Similarity của vector.
   * Nếu CATALOG_SERVICE_URL khả dụng, bổ sung price-range boost ±30%.
   * Sử dụng toán tử <=> của pgvector để tính khoảng cách cosine trực tiếp trong DB.
   */
  async getContentBasedProducts(
    productId: string,
    limit: number = 8,
  ): Promise<Array<{ id: string; score: number }>> {
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `
        SELECT 
          product_id,
          1 - (embedding <=> (SELECT embedding FROM product_vectors WHERE product_id = $1::uuid)) AS similarity_score
        FROM product_vectors 
        WHERE product_id != $1::uuid
          AND (SELECT embedding FROM product_vectors WHERE product_id = $1::uuid) IS NOT NULL
        ORDER BY embedding <=> (SELECT embedding FROM product_vectors WHERE product_id = $1::uuid)
        LIMIT $2;
      `,
        productId,
        limit + 5, // Lấy dư để boost có thể tái xếp hạng
      );

      const candidates = rows.map((row) => ({
        id: row.product_id as string,
        score: parseFloat(row.similarity_score) || 0,
      }));

      // ── Price-range boost ±30% ───────────────────────────────────────────
      const boosted = await this.applyPriceBoost(productId, candidates);

      return boosted.slice(0, limit);
    } catch (error) {
      console.error(`[Content-Based] Failed for product: ${productId}`, error);
      return [];
    }
  }

  /**
   * Gọi catalog-service lấy giá theo lô, boost sản phẩm trong dải giá ±30%.
   * Khi lỗi, trả về candidates không thay đổi.
   */
  private async applyPriceBoost(
    sourceProductId: string,
    candidates: Array<{ id: string; score: number }>,
  ): Promise<Array<{ id: string; score: number }>> {
    try {
      const allIds = [sourceProductId, ...candidates.map((c) => c.id)];
      const res = await fetchWithTimeout(
        `${CATALOG_SERVICE_URL}/api/catalog/products/internal/prices`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: allIds }),
        },
      );

      if (!res.ok) return candidates;

      const data: any = await res.json();
      const prices: Record<string, number> = data?.data || {};

      const sourcePrice = prices[sourceProductId];
      if (!sourcePrice || sourcePrice <= 0) return candidates;

      const lowerBound = sourcePrice * 0.7;
      const upperBound = sourcePrice * 1.3;

      return candidates
        .map((c) => {
          const price = prices[c.id];
          const inRange =
            price !== undefined && price >= lowerBound && price <= upperBound;
          return {
            id: c.id,
            score: inRange ? c.score * 1.2 : c.score, // +20% nếu trong dải giá
          };
        })
        .sort((a, b) => b.score - a.score);
    } catch {
      // Lỗi catalog → trả về candidates gốc không boost
      return candidates;
    }
  }

  /**
   * [Collaborative Filtering - Item-based]
   * Tìm sản phẩm được xem/click cùng nhau bởi nhiều người dùng.
   */
  async getCollaborativeProducts(
    productId: string,
    limit: number = 6,
  ): Promise<Array<{ id: string; score: number }>> {
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `
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
      `,
        productId,
        limit,
      );

      if (rows.length === 0) {
        const indirectRows: any[] = await prisma.$queryRawUnsafe(
          `
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
        `,
          productId,
          limit,
        );

        return indirectRows.map((row) => ({
          id: row.product_id,
          score: parseFloat(row.score) || 0.1,
        }));
      }

      return rows.map((row) => ({
        id: row.product_id,
        score: parseFloat(row.score) || 0.1,
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
  async getHybridRecommendations(
    productId: string,
    limit: number = 8,
  ): Promise<string[]> {
    try {
      const [contentBased, collaborative] = await Promise.all([
        this.getContentBasedProducts(productId, limit + 3),
        this.getCollaborativeProducts(productId, limit),
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

      console.log(
        `[Hybrid] Product ${productId}: Content=${contentBased.length}, CF=${collaborative.length}, Merged=${sorted.length}`,
      );
      return sorted;
    } catch (error) {
      console.error(`[Hybrid] Failed for product: ${productId}`, error);
      return [];
    }
  }

  /**
   * Lấy top sản phẩm phổ biến nhất để hiển thị ở trang chủ.
   * Tính dựa trên log tương tác trong 7 ngày gần nhất.
   * excludeIds: sản phẩm cần ẩn (đã mua, trong cart, impression cao).
   */
  async getPopularProducts(
    limit: number = 8,
    excludeIds: string[] = [],
  ): Promise<string[]> {
    try {
      // 1. Lấy sản phẩm bán chạy nhất từ Order Service
      const ORDER_URL =
        process.env.ORDER_SERVICE_URL || "http://localhost:3004";
      let bestSellingIds: string[] = [];
      try {
        const response = await fetchWithTimeout(
          `${ORDER_URL}/api/orders/internal/stats`,
        );
        const resData: any = await response.json();
        if (
          resData &&
          resData.success &&
          resData.data &&
          resData.data.topSellingProducts
        ) {
          bestSellingIds = resData.data.topSellingProducts.map(
            (p: any) => p.id,
          );
        }
      } catch (err: any) {
        console.warn(
          "[Popular] Failed to fetch stats from order-service:",
          err.message,
        );
      }

      // 2. Lấy dữ liệu từ logs tương tác trong 7 ngày gần nhất
      const rows: any[] = await prisma.$queryRawUnsafe(
        `
        SELECT 
          recommended_product_id AS product_id,
          COUNT(*) AS total_interactions
        FROM recommendation_logs
        WHERE event_type IN ('CLICK', 'PURCHASE')
          AND created_at >= NOW() - INTERVAL '${POPULAR_DAYS_WINDOW} days'
        GROUP BY recommended_product_id
        ORDER BY total_interactions DESC
        LIMIT $1;
      `,
        limit,
      );

      const interactionIds = rows.map((row) => row.product_id as string);

      // Gộp kết quả của 2 cách
      const allMergedIds = [...bestSellingIds, ...interactionIds];
      const excludeSet = new Set(excludeIds);
      const uniqueIds = new Set(
        allMergedIds.filter((id) => !excludeSet.has(id)),
      );

      // 3. Nếu chưa đủ limit, fallback về sản phẩm có vector mới nhất
      if (uniqueIds.size < limit) {
        const vectorRows: any[] = await prisma.$queryRawUnsafe(
          `
          SELECT product_id 
          FROM product_vectors
          WHERE product_id != ALL($1::uuid[])
          ORDER BY computed_at DESC
          LIMIT $2;
        `,
          Array.from(excludeSet).length > 0
            ? `{${Array.from(excludeSet).join(",")}}`
            : "{}",
          limit,
        );

        vectorRows.forEach((r: any) => uniqueIds.add(r.product_id));
      }

      return Array.from(uniqueIds).slice(0, limit);
    } catch (error) {
      console.error("[Popular] Failed to fetch popular products", error);
      return [];
    }
  }

  /**
   * [Personalized Feed]
   * Tổng hợp user vector từ user_product_events (VIEW×1, ADD_TO_CART×2)
   * và lịch sử PURCHASE từ Order Service (×3).
   * Dùng pgvector để tìm sản phẩm phù hợp nhất.
   * Fallback sang getPopularProducts nếu không đủ dữ liệu.
   */
  async getPersonalizedFeed(
    customerId: string,
    limit: number = 8,
    excludeIds: string[] = [],
  ): Promise<string[]> {
    try {
      // Lấy events từ user_product_events (VIEW + ADD_TO_CART)
      const events = await prisma.userProductEvent.findMany({
        where: { customer_id: customerId },
        orderBy: { created_at: "desc" },
        take: 100,
      });

      // Lấy PURCHASE từ Order Service (không ghi vào user_product_events)
      const purchasedIds = await this.getPurchasedProductIds(customerId);

      // Tổng hợp weighted product scores
      const weightedMap = new Map<string, number>();

      for (const event of events) {
        const weight = EVENT_WEIGHTS[event.event_type] ?? 1.0;
        const current = weightedMap.get(event.product_id) || 0;
        weightedMap.set(event.product_id, current + weight);
      }

      // PURCHASE × 3 — từ Order Service
      for (const pid of purchasedIds) {
        const current = weightedMap.get(pid) || 0;
        weightedMap.set(pid, current + EVENT_WEIGHTS.PURCHASE);
      }

      if (weightedMap.size === 0) {
        console.log(
          `[Personalized] No events for ${customerId}, fallback to popular`,
        );
        return this.getPopularProducts(limit, excludeIds);
      }

      // Sắp xếp theo trọng số, lấy top source products
      const topSourceIds = Array.from(weightedMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

      // Dùng pgvector tìm sản phẩm tương tự với user's top interests
      const excludeSet = new Set([
        ...excludeIds,
        ...topSourceIds, // Không gợi ý lại chính sản phẩm đã xem
      ]);

      const excludeArr = Array.from(excludeSet);

      // Tính centroid vector từ top source products
      const scoreMap = new Map<string, number>();

      await Promise.all(
        topSourceIds.map(async (sourceId, idx) => {
          const weight = weightedMap.get(sourceId) || 1;
          const recs = await this.getContentBasedProducts(sourceId, limit + 3);

          for (const rec of recs) {
            if (excludeSet.has(rec.id)) continue;
            const current = scoreMap.get(rec.id) || 0;
            // Trọng số theo thứ tự source + event weight
            const rankBoost = 1 / (idx + 1);
            scoreMap.set(
              rec.id,
              current + rec.score * weight * rankBoost * 0.2,
            );
          }
        }),
      );

      if (scoreMap.size === 0) {
        return this.getPopularProducts(limit, excludeIds);
      }

      const sorted = Array.from(scoreMap.entries())
        .filter(([id]) => !excludeArr.includes(id))
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      console.log(
        `[Personalized] Customer ${customerId}: Sources=${topSourceIds.length}, Results=${sorted.length}`,
      );

      // Fallback nếu kết quả ít hơn limit/2
      if (sorted.length < Math.floor(limit / 2)) {
        const popular = await this.getPopularProducts(
          limit - sorted.length,
          [...excludeArr, ...sorted],
        );
        return [...sorted, ...popular];
      }

      return sorted;
    } catch (error) {
      console.error(
        `[Personalized] Failed for customer ${customerId}:`,
        error,
      );
      return this.getPopularProducts(limit, excludeIds);
    }
  }

  /**
   * Tính toán excludeIds dựa trên:
   * - Sản phẩm đã mua trong 30 ngày (từ Order Service)
   * - Sản phẩm trong cart (do client truyền lên)
   * - Sản phẩm IMPRESSION > 10 mà không CLICK
   */
  async computeExcludeIds(
    customerId?: string,
    cartProductIds: string[] = [],
  ): Promise<string[]> {
    const [purchasedIds, highImpressionIds] = await Promise.all([
      customerId ? this.getPurchasedProductIds(customerId) : Promise.resolve([]),
      this.getHighImpressionNoClickIds(customerId),
    ]);

    const excludeSet = new Set([
      ...purchasedIds,
      ...cartProductIds,
      ...highImpressionIds,
    ]);

    return Array.from(excludeSet);
  }

  /**
   * [Batch Recommendation]
   * Lấy gợi ý tổng hợp từ nhiều sản phẩm nguồn.
   * Dùng cho trường hợp hành vi đa dạng: merge kết quả từ top-N sp gần nhất.
   * Mỗi nguồn đóng góp ngang nhau theo rank, loại bỏ trùng lặp và sp nguồn chính.
   */
  async getBatchRecommendations(
    productIds: string[],
    limit: number = 8,
  ): Promise<string[]> {
    try {
      const uniqueSourceIds = [...new Set(productIds)].slice(0, 5); // Tối đa 5 nguồn

      // Chạy song song recommendations cho từng sp nguồn
      const results = await Promise.all(
        uniqueSourceIds.map((id) =>
          this.getHybridRecommendations(id, limit).catch(() => [] as string[]),
        ),
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

      console.log(
        `[BatchRec] Sources=${uniqueSourceIds.length}, Merged=${sorted.length} results`,
      );
      return sorted;
    } catch (error) {
      console.error("[BatchRec] Failed", error);
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
    eventType: "IMPRESSION" | "CLICK" | "PURCHASE",
    customerId?: string,
    similarityScore?: number,
  ) {
    try {
      await prisma.recommendationLog.create({
        data: {
          source_product_id: sourceProductId,
          recommended_product_id: recommendedProductId,
          event_type: eventType,
          customer_id: customerId || null,
          similarity_score: similarityScore || null,
        },
      });
    } catch (error) {
      console.error("[RecommendationService] Failed to log interaction", error);
    }
  }
}

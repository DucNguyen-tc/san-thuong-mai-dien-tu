import { Request, Response } from "express";
import { RecommendationService } from "../services/recommendation.service";

const recommendationService = new RecommendationService();

export class RecommendationController {
  /**
   * GET /api/recommendations/popular?limit=8
   * Lấy danh sách sản phẩm phổ biến nhất để hiển thị ở trang chủ (cho guest user).
   * QUAN TRỌNG: Route này phải đặt TRƯỚC route /:id vì "popular" sẽ bị bắt như một :id.
   */
  async getPopularProducts(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 8;
      const productIds = await recommendationService.getPopularProducts(limit);

      res.json({
        success: true,
        data: productIds,
        meta: {
          algorithm: "popular",
          count: productIds.length,
        },
      });
    } catch (error) {
      console.error("[RecommendationController] Error getting popular", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }

  /**
   * GET /api/recommendations/:id?limit=5
   * Lấy danh sách sản phẩm gợi ý theo thuật toán Hybrid (Content-based + Collaborative).
   * Dùng cho trường hợp "focused" — user tập trung vào 1 nhóm sản phẩm.
   */
  async getRecommendations(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 8;

      const similarProductIds =
        await recommendationService.getHybridRecommendations(id, limit);

      res.json({
        success: true,
        data: similarProductIds,
        meta: {
          algorithm: "hybrid",
          description: "Content-based (60%) + Collaborative Filtering (40%)",
          source_product_id: id,
          count: similarProductIds.length,
        },
      });
    } catch (error) {
      console.error("[RecommendationController] Error", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tìm kiếm sản phẩm gợi ý",
      });
    }
  }

  /**
   * POST /api/recommendations/batch
   * Lấy gợi ý từ nhiều sản phẩm nguồn — dùng cho người dùng có hành vi đa dạng.
   * Body: { productIds: string[], limit?: number }
   */
  async getBatchRecommendations(req: Request, res: Response) {
    try {
      const { productIds, limit } = req.body;

      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "productIds là mảng bắt buộc" });
      }

      const parsedLimit = parseInt(limit) || 8;
      const result = await recommendationService.getBatchRecommendations(
        productIds,
        parsedLimit,
      );

      res.json({
        success: true,
        data: result,
        meta: {
          algorithm: "batch-hybrid",
          description: "Merged recommendations from multiple source products",
          source_count: productIds.length,
          count: result.length,
        },
      });
    } catch (error) {
      console.error(
        "[RecommendationController] Error batch recommendations",
        error,
      );
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }

  /**
   * POST /api/recommendations/log
   * Lưu log hành vi người dùng để cải thiện Collaborative Filtering theo thời gian.
   */
  async logInteraction(req: Request, res: Response) {
    try {
      const {
        sourceProductId,
        recommendedProductId,
        eventType,
        customerId,
        similarityScore,
      } = req.body;

      if (!sourceProductId || !recommendedProductId || !eventType) {
        return res
          .status(400)
          .json({ success: false, message: "Thiếu dữ liệu bắt buộc" });
      }

      await recommendationService.logInteraction(
        sourceProductId,
        recommendedProductId,
        eventType,
        customerId,
        similarityScore,
      );

      res.json({ success: true });
    } catch (error) {
      console.error("[RecommendationController] Error logging", error);
      res.status(500).json({ success: false });
    }
  }
}

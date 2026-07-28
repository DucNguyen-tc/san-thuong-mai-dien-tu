import { Request, Response } from 'express';
import { RecommendationService } from '../services/recommendation.service';

const recommendationService = new RecommendationService();

export class RecommendationController {
  
  async getRecommendations(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;

      const similarProductIds = await recommendationService.getSimilarProducts(id, limit);

      // Trả về ID các sản phẩm tương tự. 
      // Frontend sẽ gọi sang Catalog Service để lấy thông tin chi tiết (tên, giá, ảnh)
      // dựa trên mảng IDs này, hoặc Backend BFF sẽ tổng hợp.
      res.json({
        success: true,
        data: similarProductIds
      });
    } catch (error) {
      console.error('[RecommendationController] Error', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tìm kiếm sản phẩm gợi ý'
      });
    }
  }

  async logInteraction(req: Request, res: Response) {
    try {
      const { sourceProductId, recommendedProductId, eventType, customerId } = req.body;
      
      await recommendationService.logInteraction(
        sourceProductId, 
        recommendedProductId, 
        eventType, 
        customerId
      );

      res.json({ success: true });
    } catch (error) {
      console.error('[RecommendationController] Error logging', error);
      res.status(500).json({ success: false });
    }
  }
}

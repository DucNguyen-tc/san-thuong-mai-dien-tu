import { Request, Response } from "express";
import { SearchService } from "../services/search.service";
import { SuggestService } from "../services/suggest.service";
import { SearchParams } from "../types/search.types";

export class SearchController {
  /**
   * GET /api/search/products
   * Tìm kiếm sản phẩm
   */
  static async searchProducts(req: Request, res: Response) {
    try {
      const {
        q,
        page,
        limit,
        category_id,
        price_min,
        price_max,
        color,
        brand,
        has_discount,
        sort,
      } = req.query;

      const params: SearchParams = {
        q: q ? String(q) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        category_id: category_id ? String(category_id) : undefined,
        price_min: price_min ? Number(price_min) : undefined,
        price_max: price_max ? Number(price_max) : undefined,
        color: color ? String(color) : undefined,
        brand: brand ? String(brand) : undefined,
        has_discount:
          has_discount !== undefined
            ? has_discount === "true" || has_discount === "1"
            : undefined,
        sort: sort as any,
      };

      const result = await SearchService.searchProducts(params);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("[SearchController.searchProducts Error]:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi tìm kiếm sản phẩm",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/search/suggest
   * Autocomplete gợi ý từ khóa & top sản phẩm
   */
  static async suggest(req: Request, res: Response) {
    try {
      const { q, limit } = req.query;
      const query = q ? String(q) : "";
      const limitNumber = limit ? Number(limit) : 5;

      const result = await SuggestService.getSuggestions(query, limitNumber);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("[SearchController.suggest Error]:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi lấy gợi ý tìm kiếm",
        error: error.message,
      });
    }
  }
}

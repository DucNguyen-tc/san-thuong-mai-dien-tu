import { Request, Response } from "express";
import { VisualService } from "../services/visual.service";

export class VisualController {
  /**
   * POST /search/visual
   * Nhận file ảnh qua multipart/form-data (field 'image') hoặc imageUrl từ body.
   */
  static async searchByImage(req: Request, res: Response) {
    try {
      const file = req.file;
      const imageUrl = req.body?.imageUrl || (req.query?.imageUrl as string);
      const limitRaw = req.body?.limit || req.query?.limit;
      const limit = limitRaw ? parseInt(String(limitRaw), 10) : 12;

      let imageInput: Buffer | string | null = null;

      if (file && file.buffer) {
        imageInput = file.buffer;
      } else if (imageUrl && typeof imageUrl === "string" && imageUrl.trim()) {
        imageInput = imageUrl.trim();
      }

      if (!imageInput) {
        return res.status(400).json({
          success: false,
          message:
            "Vui lòng cung cấp hình ảnh để tìm kiếm (tải file qua trường 'image' hoặc truyền 'imageUrl').",
        });
      }

      const result = await VisualService.searchByImage(imageInput, limit);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("[VisualController] ❌ Lỗi tìm kiếm bằng hình ảnh:", error);
      return res.status(500).json({
        success: false,
        message: error?.message || "Đã xảy ra lỗi khi tìm kiếm bằng hình ảnh.",
      });
    }
  }
}

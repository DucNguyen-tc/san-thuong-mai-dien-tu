import { Request, Response, NextFunction } from 'express';
import { PromotionService } from '../services/promotion.service';
import { sendResponse } from '../utils/response';
import { CreatePromotionInput, UpdatePromotionInput } from '../schemas/promotion.schema';

const promotionService = new PromotionService();

export const getPromotions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const promotions = await promotionService.getAll();
    return sendResponse(res, 200, true, 'Lấy danh sách khuyến mãi thành công', promotions);
  } catch (error) {
    next(error);
  }
};

export const getPromotionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const promotion = await promotionService.getById(req.params.id);
    return sendResponse(res, 200, true, 'Lấy chi tiết khuyến mãi thành công', promotion);
  } catch (error) {
    next(error);
  }
};

export const createPromotion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as CreatePromotionInput;
    const promotion = await promotionService.create(input);
    return sendResponse(res, 201, true, 'Tạo khuyến mãi thành công', promotion);
  } catch (error) {
    next(error);
  }
};

export const updatePromotion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as UpdatePromotionInput;
    const promotion = await promotionService.update(req.params.id, input);
    return sendResponse(res, 200, true, 'Cập nhật khuyến mãi thành công', promotion);
  } catch (error) {
    next(error);
  }
};

export const deletePromotion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await promotionService.remove(req.params.id);
    return sendResponse(res, 200, true, 'Xóa khuyến mãi thành công');
  } catch (error) {
    next(error);
  }
};

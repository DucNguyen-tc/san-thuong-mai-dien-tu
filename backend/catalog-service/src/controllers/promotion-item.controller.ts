import { Request, Response, NextFunction } from 'express';
import { PromotionItemService } from '../services/promotion-item.service';
import { sendResponse } from '../utils/response';
import { serializeBigInt } from '../utils/serializeBigInt';
import { CreatePromotionItemInput } from '../schemas/promotion-item.schema';

const itemService = new PromotionItemService();

export const getItemsByPromotion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await itemService.getByPromotionId(req.params.promotionId);
    return sendResponse(res, 200, true, 'Lấy danh sách khuyến mãi thành công', serializeBigInt(items));
  } catch (error) {
    next(error);
  }
};

export const addItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as CreatePromotionItemInput;
    // Tự động gán promotionId từ URL nếu có
    if (req.params.promotionId && !input.promotion_id) {
      input.promotion_id = req.params.promotionId;
    }
    const item = await itemService.create(input);
    return sendResponse(res, 201, true, 'Thêm sản phẩm vào khuyến mãi thành công', serializeBigInt(item));
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await itemService.remove(req.params.id);
    return sendResponse(res, 200, true, 'Xóa sản phẩm khỏi khuyến mãi thành công');
  } catch (error) {
    next(error);
  }
};

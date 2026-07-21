import { Request, Response, NextFunction } from 'express';
import { VariantService } from '../services/variant.service';
import { sendResponse } from '../utils/response';
import { serializeBigInt } from '../utils/serializeBigInt';
import { CreateVariantInput, UpdateVariantInput } from '../schemas/variant.schema';

const variantService = new VariantService();

export const getVariants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const product_id = typeof req.query.product_id === 'string' ? req.query.product_id : undefined;
    const includeInactive = req.query.includeInactive === 'true';

    const result = await variantService.getAll({ page, limit, product_id, includeInactive });
    return sendResponse(res, 200, true, 'Lấy danh sách biến thể thành công', serializeBigInt(result));
  } catch (error) {
    next(error);
  }
};

export const getVariantById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const variant = await variantService.getById(req.params.id);
    return sendResponse(res, 200, true, 'Lấy chi tiết biến thể thành công', serializeBigInt(variant));
  } catch (error) {
    next(error);
  }
};

export const createVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as CreateVariantInput;
    const variant = await variantService.create(input);
    return sendResponse(res, 201, true, 'Tạo biến thể thành công', serializeBigInt(variant));
  } catch (error) {
    next(error);
  }
};

export const updateVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as UpdateVariantInput;
    const variant = await variantService.update(req.params.id, input);
    return sendResponse(res, 200, true, 'Cập nhật biến thể thành công', serializeBigInt(variant));
  } catch (error) {
    next(error);
  }
};

export const deleteVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await variantService.remove(req.params.id);
    return sendResponse(res, 200, true, 'Đã ẩn (soft delete) biến thể thành công');
  } catch (error) {
    next(error);
  }
};

export const getBulk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { variantIds } = req.body;
    if (!Array.isArray(variantIds)) {
      return sendResponse(res, 400, false, 'variantIds phải là một mảng string');
    }
    const variants = await variantService.getBulk(variantIds);
    return sendResponse(res, 200, true, 'Lấy danh sách variants thành công', serializeBigInt(variants));
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, action } = req.body;
    if (!Array.isArray(items) || !['deduct', 'restore'].includes(action)) {
      return sendResponse(res, 400, false, 'Dữ liệu đầu vào items hoặc action không hợp lệ');
    }
    await variantService.updateStockBulk(items, action);
    return sendResponse(res, 200, true, 'Cập nhật tồn kho thành công');
  } catch (error) {
    next(error);
  }
};

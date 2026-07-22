import { Request, Response, NextFunction } from 'express';
import { ProductImageService } from '../services/product-image.service';
import { sendResponse } from '../utils/response';
import { serializeBigInt } from '../utils/serializeBigInt';
import { CreateProductImageInput, UpdateProductImageInput } from '../schemas/product-image.schema';

const imageService = new ProductImageService();

export const getImagesByProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const images = await imageService.getByProductId(req.params.productId);
    return sendResponse(res, 200, true, 'Lấy danh sách ảnh thành công', serializeBigInt(images));
  } catch (error) {
    next(error);
  }
};

export const addImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as CreateProductImageInput;
    const image = await imageService.create(input);
    return sendResponse(res, 201, true, 'Thêm ảnh thành công', serializeBigInt(image));
  } catch (error) {
    next(error);
  }
};

export const updateImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as UpdateProductImageInput;
    const image = await imageService.update(req.params.id, input);
    return sendResponse(res, 200, true, 'Cập nhật ảnh thành công', serializeBigInt(image));
  } catch (error) {
    next(error);
  }
};

export const deleteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await imageService.remove(req.params.id);
    return sendResponse(res, 200, true, 'Xóa ảnh thành công');
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { sendResponse } from '../utils/response';
import { serializeBigInt } from '../utils/serializeBigInt';
import {
  CreateProductInput,
  UpdateProductInput,
} from '../schemas/product.schema';

const productService = new ProductService();

// Lưu ý: req.body ở các route POST/PUT ĐÃ được validate + parse bởi
// middleware validateBody (khai báo tại routes/product.routes.ts).

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const category_id = typeof req.query.category_id === 'string' ? req.query.category_id : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const has_discount = req.query.has_discount === 'true';
    // includeInactive chỉ dùng cho màn Admin — FE truyền ?includeInactive=true
    const includeInactive = req.query.includeInactive === 'true';
    const sort = typeof req.query.sort === 'string' ? req.query.sort : undefined;

    const result = await productService.getAll({ page, limit, category_id, search, includeInactive, has_discount, sort });
    return sendResponse(res, 200, true, 'Lấy danh sách sản phẩm thành công', serializeBigInt(result));
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.getById(req.params.id);
    return sendResponse(res, 200, true, 'Lấy chi tiết sản phẩm thành công', serializeBigInt(product));
  } catch (error) {
    next(error);
  }
};



export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as CreateProductInput;
    const product = await productService.create(input);
    return sendResponse(res, 201, true, 'Tạo sản phẩm thành công', serializeBigInt(product));
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as UpdateProductInput;
    const product = await productService.update(req.params.id, input);
    return sendResponse(res, 200, true, 'Cập nhật sản phẩm thành công', serializeBigInt(product));
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await productService.remove(req.params.id);
    return sendResponse(res, 200, true, 'Đã ẩn (soft delete) sản phẩm thành công');
  } catch (error) {
    next(error);
  }
};



import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { sendResponse } from '../utils/response';
import { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema';

const categoryService = new CategoryService();

// Lưu ý: req.body ở đây ĐÃ được validate + parse bởi middleware validateBody
// (khai báo tại routes/category.routes.ts), Controller không validate lại.

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.getAll();
    return sendResponse(res, 200, true, 'Lấy danh sách danh mục thành công', categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryTree = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tree = await categoryService.getTree();
    return sendResponse(res, 200, true, 'Lấy danh mục dạng cây thành công', tree);
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryService.getById(req.params.id);
    return sendResponse(res, 200, true, 'Lấy chi tiết danh mục thành công', category);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as CreateCategoryInput;
    const category = await categoryService.create(input);
    return sendResponse(res, 201, true, 'Tạo danh mục thành công', category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as UpdateCategoryInput;
    const category = await categoryService.update(req.params.id, input);
    return sendResponse(res, 200, true, 'Cập nhật danh mục thành công', category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await categoryService.remove(req.params.id);
    return sendResponse(res, 200, true, 'Xóa danh mục thành công');
  } catch (error) {
    next(error);
  }
};

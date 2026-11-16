import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../exceptions/AppError';
import { sendResponse } from '../utils/response';

/**
 * errorHandler — Middleware xử lý lỗi tập trung (AGENT.md mục 4.2).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  // Lỗi nghiệp vụ có kiểm soát (AppError, NotFoundError, BadRequestError, ConflictError...)
  if (err instanceof AppError) {
    return sendResponse(res, err.statusCode, false, err.message);
  }

  // Lỗi Prisma đã biết (vi phạm ràng buộc unique, FK...)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return sendResponse(res, 409, false, 'Giao dịch thanh toán cho đơn hàng này đã tồn tại');
    }
    if (err.code === 'P2003') {
      return sendResponse(res, 409, false, 'Không thể thực hiện vì dữ liệu tham chiếu không hợp lệ');
    }
    if (err.code === 'P2025') {
      return sendResponse(res, 404, false, 'Không tìm thấy bản ghi thanh toán cần thao tác');
    }
  }

  // Lỗi không xác định — log ra server console, trả lỗi 500 chung cho client
  console.error('[Payment Service Unhandled Error]', err);
  return sendResponse(res, 500, false, 'Internal Server Error');
}

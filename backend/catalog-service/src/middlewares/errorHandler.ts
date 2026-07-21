import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../exceptions/AppError';
import { sendResponse } from '../utils/response';

/**
 * errorHandler — Middleware xử lý lỗi tập trung (AGENT.md mục 4.2).
 * Bắt mọi lỗi được next(error) từ Controller, KHÔNG bao giờ trả
 * stack trace / lỗi thô của Prisma cho client.
 * Đăng ký middleware này SAU CÙNG trong app.ts (sau toàn bộ routes).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  // Lỗi nghiệp vụ có kiểm soát (NotFoundError, BadRequestError, ConflictError...)
  if (err instanceof AppError) {
    return sendResponse(res, err.statusCode, false, err.message);
  }

  // Lỗi Prisma đã biết (vi phạm ràng buộc unique, FK...)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return sendResponse(res, 409, false, 'Dữ liệu bị trùng (unique constraint)');
    }
    if (err.code === 'P2003') {
      return sendResponse(
        res,
        409,
        false,
        'Không thể thực hiện vì dữ liệu đang được tham chiếu bởi bản ghi khác'
      );
    }
    if (err.code === 'P2025') {
      return sendResponse(res, 404, false, 'Không tìm thấy bản ghi cần thao tác');
    }
  }

  // Lỗi không xác định — log chi tiết ở server, chỉ trả thông báo chung cho client
  console.error('[Unhandled Error]', err);
  return sendResponse(res, 500, false, 'Internal Server Error');
}

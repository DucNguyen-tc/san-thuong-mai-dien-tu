import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { sendResponse } from '../utils/response';

/**
 * validate — Middleware factory kiểm định req.body bằng Zod schema
 * trước khi request đi vào Controller (theo AGENT.md mục 4.1).
 * Nếu hợp lệ, body được ghi đè bằng dữ liệu đã parse (đã áp dụng default/transform của schema).
 */
export const validateBody =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const zodError = result.error as ZodError;
      const firstIssue = zodError.issues[0];
      const message = firstIssue
        ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
        : 'Dữ liệu gửi lên không hợp lệ';
      return sendResponse(res, 400, false, message);
    }
    req.body = result.data;
    next();
  };

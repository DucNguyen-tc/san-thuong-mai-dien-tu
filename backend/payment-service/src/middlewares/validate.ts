import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { sendResponse } from '../utils/response';

/**
 * validateBody — Middleware kiểm định req.body bằng Zod schema
 */
export const validateBody =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const zodError = result.error as ZodError;
      const firstIssue = zodError.issues[0];
      const message = firstIssue
        ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
        : 'Dữ liệu body không hợp lệ';
      return sendResponse(res, 400, false, message);
    }
    req.body = result.data;
    next();
  };

/**
 * validateParams — Middleware kiểm định req.params bằng Zod schema
 */
export const validateParams =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const zodError = result.error as ZodError;
      const firstIssue = zodError.issues[0];
      const message = firstIssue
        ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
        : 'Dữ liệu params không hợp lệ';
      return sendResponse(res, 400, false, message);
    }
    req.params = result.data;
    next();
  };

/**
 * validateQuery — Middleware kiểm định req.query bằng Zod schema
 */
export const validateQuery =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const zodError = result.error as ZodError;
      const firstIssue = zodError.issues[0];
      const message = firstIssue
        ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
        : 'Dữ liệu query không hợp lệ';
      return sendResponse(res, 400, false, message);
    }
    req.query = result.data;
    next();
  };

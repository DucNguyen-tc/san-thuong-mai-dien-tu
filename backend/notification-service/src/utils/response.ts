import { Response } from 'express';

/**
 * sendResponse — Helper trả response đúng convention chung của cả nhóm:
 * { success, message, data }
 * (Đồng bộ với utils/response.ts của identity-service)
 */
export const sendResponse = (
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: unknown
) => {
  return res.status(statusCode).json({
    success,
    message,
    data: data ?? null,
  });
};

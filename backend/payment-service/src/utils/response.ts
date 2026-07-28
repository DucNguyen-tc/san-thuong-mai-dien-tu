import { Response } from 'express';

/**
 * sendResponse — Helper trả response đúng convention chung của hệ thống:
 * { success, message, data }
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

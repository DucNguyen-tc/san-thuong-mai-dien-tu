import { Response } from "express";

export function successResponse<T>(res: Response, data: T, message: string = "Thành công", statusCode: number = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

export function errorResponse(res: Response, message: string = "Đã xảy ra lỗi", statusCode: number = 400, errors?: any) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {})
  });
}


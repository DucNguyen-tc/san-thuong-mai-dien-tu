/**
 * AppError — Lớp lỗi cơ sở cho toàn bộ lỗi nghiệp vụ có kiểm soát trong service.
 * Mọi lỗi ném ra từ Service layer nên kế thừa lớp này để errorHandler
 * biết chính xác statusCode + message thân thiện cần trả về client.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 404 — Không tìm thấy tài nguyên (category/product/variant không tồn tại) */
export class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy tài nguyên') {
    super(message, 404);
  }
}

/** 400 — Dữ liệu đầu vào không hợp lệ (ngoài phạm vi Zod, ví dụ business rule) */
export class BadRequestError extends AppError {
  constructor(message = 'Yêu cầu không hợp lệ') {
    super(message, 400);
  }
}

/** 409 — Xung đột dữ liệu (trùng slug, xóa category đang có product tham chiếu,...) */
export class ConflictError extends AppError {
  constructor(message = 'Dữ liệu bị xung đột') {
    super(message, 409);
  }
}

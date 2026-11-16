/**
 * AppError — Lớp lỗi cơ sở cho toàn bộ lỗi nghiệp vụ có kiểm soát trong payment-service.
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

/** 404 — Không tìm thấy tài nguyên (giao dịch thanh toán không tồn tại) */
export class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy thông tin thanh toán') {
    super(message, 404);
  }
}

/** 400 — Dữ liệu đầu vào không hợp lệ */
export class BadRequestError extends AppError {
  constructor(message = 'Yêu cầu không hợp lệ') {
    super(message, 400);
  }
}

/** 409 — Xung đột dữ liệu (ví dụ: giao dịch thanh toán cho đơn hàng đã tồn tại/hoàn tất) */
export class ConflictError extends AppError {
  constructor(message = 'Dữ liệu giao dịch thanh toán bị xung đột') {
    super(message, 409);
  }
}

/** 500 — Lỗi hệ thống */
export class InternalServerError extends AppError {
  constructor(message = 'Lỗi hệ thống xử lý thanh toán') {
    super(message, 500);
  }
}

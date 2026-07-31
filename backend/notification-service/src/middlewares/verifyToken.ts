import { Request, Response, NextFunction } from 'express';

// Tạo một interface mới kế thừa từ Request của Express để chứa thêm thông tin user
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

/**
 * Middleware dùng chung cho TẤT CẢ các service (Catalog, Cart, Order...)
 * Để bảo vệ các route yêu cầu đăng nhập.
 */
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Đọc thông tin user do API Gateway truyền xuống qua Header
  const userId = req.headers['x-user-id'] as string;
  const role = req.headers['x-user-role'] as string;

  if (!userId || !role) {
    return res.status(401).json({
      success: false,
      message: 'Không có quyền truy cập. Yêu cầu phải đi qua API Gateway.',
    });
  }

  // Gắn thông tin user vào request để các Controller bên dưới sử dụng
  req.user = { userId, role };
  
  next();
};

/**
 * Middleware kiểm tra quyền Admin
 * Bắt buộc phải đặt SAU middleware verifyToken
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập tài nguyên này (Require Admin)',
    });
  }
  next();
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy Token xác thực (Unauthorized)',
      });
    }

    const token = authHeader.split(' ')[1];

    const secret = process.env.JWT_SECRET || 'super-secret-jwt-key';
    const decoded = jwt.verify(token, secret) as { userId: string; role: string };

    // Gắn thông tin user vào request
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn (Forbidden)',
    });
  }
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

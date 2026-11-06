import { Request, Response, NextFunction } from "express";

export interface AuthenticatedUser {
  id: string;
  role: string;
  email?: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware trích xuất thông tin người dùng từ headers do API Gateway forward
 * (x-user-id, x-user-role, x-user-email, x-user-name)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  const userRole = (req.headers["x-user-role"] as string) || "CUSTOMER";
  const userEmail = req.headers["x-user-email"] as string;
  const userName = req.headers["x-user-name"] as string;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Không tìm thấy thông tin xác thực người dùng (Unauthorized)"
    });
  }

  req.user = {
    id: userId,
    role: userRole,
    email: userEmail,
    name: userName
  };

  next();
}


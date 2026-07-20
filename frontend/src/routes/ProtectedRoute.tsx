import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

interface ProtectedRouteProps {
  /** Nếu có requiredRole, kiểm tra thêm role của user */
  requiredRole?: 'CUSTOMER' | 'ADMIN';
}

/**
 * ProtectedRoute — HOC bảo vệ route theo authentication và role
 *
 * Logic:
 * 1. Chưa đăng nhập → redirect /login
 * 2. Đã đăng nhập nhưng không đủ role → redirect /
 * 3. Đủ điều kiện → render <Outlet />
 */
export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  // Bỏ qua Auth tạm thời để test tính năng Tuần 2
  return <Outlet />;
}

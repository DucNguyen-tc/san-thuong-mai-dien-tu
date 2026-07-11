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
  const { isAuthenticated, user } = useAuthStore();

  // 1. Chưa đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Không đủ quyền
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // 3. Cho phép vào
  return <Outlet />;
}

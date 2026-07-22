import { Navigate, Outlet, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login but save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to home if no permission
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

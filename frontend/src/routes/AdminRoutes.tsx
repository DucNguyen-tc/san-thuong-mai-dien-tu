import { Route } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
import UsersList from '@/pages/admin/UsersList';
import ProductManagement from '@/pages/admin/ProductManagement';
import PromotionManagement from '@/pages/admin/PromotionManagement';

/**
 * AdminRoutes — Tập hợp tất cả routes dành cho khu vực admin
 * Bảo vệ bởi ProtectedRoute (yêu cầu role ADMIN)
 * Bọc bởi AdminLayout (Sidebar + Header)
 * Import và sử dụng trong AppRoutes.tsx làm direct JSX child.
 *
 * Thêm route admin mới: đặt thêm <Route> bên trong AdminLayout wrapper này
 */
export const AdminRoutes = (
  <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
    <Route element={<AdminLayout />}>
      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/customers" element={<UsersList />} />
      <Route path="/admin/products" element={<ProductManagement />} />
      <Route path="/admin/promotions" element={<PromotionManagement />} />
      {/* Thêm routes admin tại đây khi phát triển thêm:
      <Route path="/admin/orders" element={<OrderManagement />} />
      <Route path="/admin/payments" element={<PaymentManagement />} />
      <Route path="/admin/reports" element={<Reports />} />
      <Route path="/admin/settings" element={<Settings />} />
      */}
    </Route>
  </Route>
);
export default AdminRoutes;


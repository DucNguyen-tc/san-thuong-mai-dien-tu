import { Route } from 'react-router-dom';
import UserLayout from '@/components/layout/UserLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import Home from '@/pages/user/Home';
import ProfileLayout from '@/pages/user/profile/ProfileLayout';

/**
 * UserRoutes — Tập hợp tất cả routes dành cho khu vực người dùng
 * Được bọc bởi UserLayout (Header + Footer)
 * Import và sử dụng trong AppRoutes.tsx làm direct JSX child.
 *
 * Thêm route user mới: đặt thêm <Route> bên trong wrapper này
 */
export const UserRoutes = (
  <Route element={<UserLayout />}>
    <Route path="/" element={<Home />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/profile" element={<ProfileLayout />} />
    </Route>
    {/* Thêm routes user tại đây khi phát triển thêm:
    <Route path="/products" element={<ProductList />} />
    <Route path="/products/:id" element={<ProductDetail />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/dashboard" element={<UserDashboard />} />
    */}
  </Route>
);
export default UserRoutes;


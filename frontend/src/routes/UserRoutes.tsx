import { Route } from 'react-router-dom';
import UserLayout from '@/components/layout/UserLayout';
import Home from '@/pages/user/Home';
import Cart from '@/pages/user/Cart';
import Checkout from '@/pages/user/Checkout';
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
    <Route path="/cart" element={<Cart />} />
    <Route path="/checkout" element={<Checkout />} />
    {/* Thêm routes user tại đây khi phát triển thêm:
    <Route path="/products" element={<ProductList />} />
    <Route path="/products/:id" element={<ProductDetail />} />
    <Route path="/dashboard" element={<UserDashboard />} />
    */}
  </Route>
);
export default UserRoutes;


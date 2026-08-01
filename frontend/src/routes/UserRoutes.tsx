import { Route } from 'react-router-dom';
import UserLayout from '@/components/layout/UserLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import Home from '@/pages/user/Home';
import ProfileLayout from '@/pages/user/profile/ProfileLayout';
import Cart from '@/pages/user/Cart';
import Checkout from '@/pages/user/Checkout';
import ProductList from '@/pages/user/ProductList';
import ProductDetail from '@/pages/user/ProductDetail';
import PaymentResult from '@/pages/user/PaymentResult';

export const UserRoutes = (
  <Route element={<UserLayout />}>
    <Route path="/" element={<Home />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/profile" element={<ProfileLayout />} />
    </Route>
    <Route path="/products" element={<ProductList />} />
    <Route path="/products/:id" element={<ProductDetail />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/payment-result" element={<PaymentResult />} />
  </Route>
);
export default UserRoutes;


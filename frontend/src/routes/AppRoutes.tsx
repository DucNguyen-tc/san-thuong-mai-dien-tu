import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import PageNotFound from '../pages/PageNotFound';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { ShoppingCart, LogOut, User } from 'lucide-react';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuthStore();
  const cartCount = useCartStore((state) => state.getCartCount());

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Navigation Bar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex-shrink-0 flex items-center text-xl font-bold text-primary-600">
                  SanThuongMai
                </Link>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link to="/" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Trang chủ
                  </Link>
                  <Link to="/products" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Sản phẩm
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link to="/cart" className="p-2 text-gray-400 hover:text-gray-500 relative">
                  <ShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700 flex items-center">
                      <User className="w-4 h-4 mr-1 text-gray-400" />
                      {user?.full_name}
                    </span>
                    <button
                      onClick={logout}
                      className="p-2 text-gray-400 hover:text-red-500"
                      title="Đăng xuất"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition"
                  >
                    Đăng nhập
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} SanThuongMai. All rights reserved.
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default AppRoutes;

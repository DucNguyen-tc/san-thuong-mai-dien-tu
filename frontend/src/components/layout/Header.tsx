import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  User,
  Search,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';

const popularSearches = ['iPhone 15 Pro Max', 'MacBook Air M3', 'Giày thể thao Nam'];

export default function Header() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { isAuthenticated, user, logout } = useAuthStore();
  const cartCount = useCartStore((state) => state.getCartCount());

  return (
    <header className="bg-surface sticky top-0 z-50 shadow-sm border-b border-outline-variant/30">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-[1280px] mx-auto gap-6">

        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold text-primary shrink-0 tracking-tight hover:opacity-90 transition-opacity"
        >
          V-Shop
        </Link>

        {/* Search Bar */}
        <div className="flex-grow max-w-2xl relative">
          <div className="relative flex items-center bg-surface-container rounded-full border border-transparent focus-within:border-primary focus-within:bg-white transition-all duration-300">
            <Search size={18} className="ml-4 text-on-surface-variant shrink-0" />
            <input
              id="searchInput"
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 150)}
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              className="w-full bg-transparent border-none focus:ring-0 px-4 py-2.5 text-sm text-on-surface outline-none"
            />
            <button className="bg-primary text-white rounded-full px-6 py-2 mr-1 text-sm font-semibold hover:bg-primary-container transition-colors">
              Tìm
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-outline-variant overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4">
                <p className="text-xs font-semibold text-on-surface-variant mb-3">Tìm kiếm phổ biến</p>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onMouseDown={() => setSearchValue(term)}
                      className="bg-surface-container-low px-3 py-1 rounded-full text-sm hover:bg-primary-fixed cursor-pointer transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Cart */}
          <Link
            to="/cart"
            className="p-2 text-on-surface-variant hover:text-primary transition-colors relative"
            aria-label="Giỏ hàng"
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-secondary-container text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* User */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" className="hidden md:block text-sm font-medium text-on-surface hover:text-primary transition-colors">
                {user?.full_name}
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="p-2 text-on-surface-variant hover:text-error transition-colors"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors p-2"
              aria-label="Tài khoản"
            >
              <User size={22} />
              <ChevronRight size={14} className="hidden md:block" />
              <span className="hidden md:block text-sm font-semibold">Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

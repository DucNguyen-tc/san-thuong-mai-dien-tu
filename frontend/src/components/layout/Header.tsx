import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  User,
  Search,
  LogOut,
  ChevronRight,
  History,
  X,
  TrendingUp,
  Loader2,
  Camera,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useSearch } from '@/hooks/useSearch';
import { formatPrice } from '@/utils/formatters';
import VisualSearchModal from '@/components/search/VisualSearchModal';

const POPULAR_SEARCHES = ['iPhone 15 Pro Max', 'MacBook Air M3', 'Samsung Galaxy', 'Giày thể thao Nam'];
const RECENT_SEARCHES_KEY = 'vshop_recent_searches';

export default function Header() {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { query, setQuery, keywords, products, isLoading } = useSearch({
    debounceMs: 200,
    limit: 5,
  });

  const { isAuthenticated, user, logout } = useAuthStore();
  const { getCartCount, fetchCart } = useCartStore();
  const cartCount = getCartCount();

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // Ignore JSON parse errors
    }
  }, []);

  // Sync cart
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save to recent searches
  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const removeRecentSearch = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((t) => t !== termToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleSearchSubmit = (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;
    saveRecentSearch(term);
    setIsSearchOpen(false);
    navigate(`/products?search=${encodeURIComponent(term)}`);
  };

  // Keyboard Navigation: Up, Down, Escape, Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen) return;

    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      return;
    }

    if (keywords.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < keywords.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : keywords.length - 1));
      } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < keywords.length) {
        e.preventDefault();
        const selectedKeyword = keywords[selectedIndex].text;
        setQuery(selectedKeyword);
        handleSearchSubmit(selectedKeyword);
      }
    }
  };

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
        <div ref={searchContainerRef} className="flex-grow max-w-[42rem] relative">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchSubmit(query);
            }}
            className="relative flex items-center bg-surface-container rounded-full border border-transparent focus-within:border-primary focus-within:bg-white transition-all duration-300"
          >
            <Search size={18} className="ml-4 text-on-surface-variant shrink-0" />
            <input
              ref={inputRef}
              id="searchInput"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(-1);
                if (!isSearchOpen) setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              className="w-full bg-transparent border-none focus:ring-0 px-4 py-2.5 text-sm text-on-surface outline-none"
              autoComplete="off"
            />

            {isLoading && (
              <Loader2 size={16} className="animate-spin text-primary mr-2 shrink-0" />
            )}

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedIndex(-1);
                  inputRef.current?.focus();
                }}
                className="text-gray-400 hover:text-gray-600 p-1 mr-1 rounded-full"
                title="Xóa"
              >
                <X size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                setIsVisualSearchOpen(true);
              }}
              className="text-gray-400 hover:text-primary hover:bg-gray-100 p-1.5 mr-1 rounded-full transition-colors shrink-0 cursor-pointer"
              title="Tìm kiếm bằng hình ảnh (AI Visual Search)"
            >
              <Camera size={17} />
            </button>

            <button type="submit" className="bg-primary text-white rounded-full px-6 py-2 mr-1 text-sm font-semibold hover:bg-primary-container transition-colors shrink-0">
              Tìm
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200 divide-y divide-gray-100">
              
              {/* TRƯỜNG HỢP 1: Đang có kết quả gõ (query có chữ) */}
              {query.trim().length > 0 ? (
                <div className="p-4 space-y-4">
                  {/* Danh sách Từ khóa gợi ý */}
                  {keywords.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Search size={13} />
                        Gợi ý từ khóa
                      </p>
                      <ul className="space-y-1">
                        {keywords.map((kw, idx) => (
                          <li key={idx}>
                            <button
                              type="button"
                              onClick={() => {
                                setQuery(kw.text);
                                handleSearchSubmit(kw.text);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                                selectedIndex === idx
                                  ? 'bg-blue-50 text-blue-600 font-medium'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <Search size={14} className="text-gray-400" />
                                {kw.highlight ? (
                                  <span dangerouslySetInnerHTML={{ __html: kw.highlight }} />
                                ) : (
                                  <span>{kw.text}</span>
                                )}
                              </span>
                              <ChevronRight size={14} className="text-gray-300" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Top Sản phẩm khớp ngay trên Dropdown */}
                  {products.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                        Sản phẩm liên quan
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {products.map((prod) => (
                          <Link
                            key={prod.id}
                            to={`/products/${prod.id}`}
                            onClick={() => {
                              saveRecentSearch(prod.name);
                              setIsSearchOpen(false);
                            }}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
                          >
                            <img
                              src={prod.image_url || 'https://via.placeholder.com/60?text=No+Img'}
                              alt={prod.name}
                              className="w-12 h-12 rounded-lg object-contain bg-gray-50 p-1 border border-gray-100 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-800 truncate group-hover:text-primary transition-colors">
                                {prod.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs font-bold text-red-600">
                                  {formatPrice(prod.price)}
                                </span>
                                {Boolean(prod.discount_percent && prod.discount_percent > 0) && (
                                  <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-1 py-0.2 rounded">
                                    -{prod.discount_percent}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Khi không tìm thấy gì */}
                  {!isLoading && keywords.length === 0 && products.length === 0 && (
                    <div className="py-6 text-center text-gray-400 text-sm">
                      Không tìm thấy gợi ý phù hợp cho "<span className="text-gray-700 font-medium">{query}</span>"
                    </div>
                  )}
                </div>
              ) : (
                /* TRƯỜNG HỢP 2: Chưa gõ gì (query rỗng) -> Hiện Lịch sử & Phổ biến */
                <div className="p-4 space-y-4">
                  {/* Lịch sử tìm kiếm gần đây */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                          <History size={13} />
                          Lịch sử tìm kiếm
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setRecentSearches([]);
                            localStorage.removeItem(RECENT_SEARCHES_KEY);
                          }}
                          className="text-[11px] text-gray-400 hover:text-red-500 transition-colors"
                        >
                          Xóa tất cả
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term) => (
                          <span
                            key={term}
                            onClick={() => {
                              setQuery(term);
                              handleSearchSubmit(term);
                            }}
                            className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 px-3 py-1 rounded-full text-xs text-gray-700 cursor-pointer transition-colors group"
                          >
                            <span>{term}</span>
                            <button
                              type="button"
                              onClick={(e) => removeRecentSearch(term, e)}
                              className="text-gray-400 hover:text-red-500 rounded-full p-0.5"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tìm kiếm phổ biến */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <TrendingUp size={13} />
                      Tìm kiếm phổ biến
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SEARCHES.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setQuery(term);
                            handleSearchSubmit(term);
                          }}
                          className="bg-gray-50 hover:bg-primary-fixed border border-gray-100 hover:border-transparent px-3 py-1 rounded-full text-xs text-gray-700 transition-colors cursor-pointer"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="hidden md:block text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors mr-2 px-3 py-1 bg-purple-50 rounded-full border border-purple-200">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                    Quản trị
                  </span>
                </Link>
              )}
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

      {/* Visual Search Modal */}
      <VisualSearchModal
        isOpen={isVisualSearchOpen}
        onClose={() => setIsVisualSearchOpen(false)}
      />
    </header>
  );
}

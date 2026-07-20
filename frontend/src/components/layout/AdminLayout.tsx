import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Sản phẩm', href: '/admin/products', icon: Package },
  { label: 'Khuyến mãi', href: '/admin/promotions', icon: Package }, // Used Package or Tag if imported
  { label: 'Đơn hàng', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Thanh toán', href: '/admin/payments', icon: CreditCard },
  { label: 'Khách hàng', href: '/admin/customers', icon: Users },
  { label: 'Báo cáo', href: '/admin/reports', icon: BarChart3 },
  { label: 'Cài đặt', href: '/admin/settings', icon: Settings },
];

/**
 * AdminLayout — Layout bọc toàn bộ trang admin
 * Cấu trúc: Sidebar (trái) + Header top + <main> (Outlet)
 * Được sử dụng trong AdminRoutes.tsx (placeholder — sẽ phát triển đầy đủ)
 */
export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-64 bg-on-surface flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link to="/" className="text-white font-bold text-xl tracking-tight">
            V-Shop
          </Link>
          <p className="text-white/50 text-xs mt-0.5">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = location.pathname === href;
            return (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-white/80 text-sm font-medium truncate">{user?.full_name}</p>
          <p className="text-white/40 text-xs truncate">{user?.email}</p>
          <button
            onClick={logout}
            className="mt-3 flex items-center gap-2 text-white/60 hover:text-error transition-colors text-sm"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-outline-variant px-6 py-4">
          <h1 className="text-sm text-on-surface-variant">
            V-Shop /{' '}
            <span className="text-on-surface font-semibold">
              {navItems.find((i) => i.href === location.pathname)?.label ?? 'Admin'}
            </span>
          </h1>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

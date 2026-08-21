import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  FolderTree,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Danh mục", href: "/admin/categories", icon: FolderTree },
  { label: "Sản phẩm", href: "/admin/products", icon: Package },
  { label: "Khuyến mãi", href: "/admin/promotions", icon: Package }, // Used Package or Tag if imported
  { label: "Đơn hàng", href: "/admin/orders", icon: ShoppingBag },
  { label: "Khách hàng", href: "/admin/customers", icon: Users },
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
    <div className="text-on-surface">
      {/* TopNavBar */}
      <header className="bg-surface-container-lowest text-primary font-body-md text-body-md border-b border-outline-variant flex justify-between items-center h-16 px-6 w-full sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="font-headline-lg text-[24px] text-primary font-bold"
          >
            V-Shop Admin
          </Link>
          <div className="hidden md:flex ml-8 items-center bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              className="bg-transparent border-none focus:ring-0 text-body-md ml-2 w-64 outline-none"
              placeholder="Tìm kiếm toàn hệ thống..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-surface-container-low transition-colors cursor-pointer rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 hover:bg-surface-container-low transition-colors cursor-pointer rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">help</span>
          </button>
          <button className="p-2 hover:bg-surface-container-low transition-colors cursor-pointer rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant bg-surface-container-low flex items-center justify-center">
            {user?.avatar_url ? (
              <img
                alt="Avatar"
                className="w-full h-full object-cover"
                src={user.avatar_url}
              />
            ) : (
              <span className="material-symbols-outlined text-outline">
                account_circle
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* SideNavBar */}
        <aside className="bg-surface-container-lowest w-[260px] h-[calc(100vh-64px)] fixed left-0 top-16 border-r border-outline-variant flex flex-col z-30">
          <div className="p-6">
            <h2 className="font-headline-md text-[18px] font-bold text-primary">
              V-Shop
            </h2>
            <p className="font-label-sm text-[12px] text-on-surface-variant">
              Bộ quản trị hệ thống
            </p>
          </div>
          <nav className="flex-1 px-2 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive = location.pathname === href;
              return (
                <Link
                  key={href}
                  to={href}
                  className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-all font-label-sm text-[12px] rounded-lg ${
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "hover:bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  <Icon
                    size={18}
                    className={
                      isActive ? "text-primary" : "text-on-surface-variant"
                    }
                  />
                  <span className={isActive ? "font-bold" : ""}>{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-outline-variant">
            <button
              onClick={logout}
              className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-surface-container-low transition-all text-on-surface-variant font-label-sm text-[12px] rounded-lg w-full"
            >
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="ml-[260px] w-full min-h-screen p-6 bg-background">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

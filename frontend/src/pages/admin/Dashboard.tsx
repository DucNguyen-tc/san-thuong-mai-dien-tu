import { BarChart3, Package, ShoppingBag, Users } from 'lucide-react';

const stats = [
  { label: 'Tổng đơn hàng', value: '1,248', icon: ShoppingBag, color: 'bg-primary/10 text-primary' },
  { label: 'Sản phẩm', value: '386', icon: Package, color: 'bg-secondary-container/20 text-secondary' },
  { label: 'Khách hàng', value: '5,721', icon: Users, color: 'bg-primary/10 text-primary' },
  { label: 'Doanh thu tháng', value: '482.5M', icon: BarChart3, color: 'bg-secondary-container/20 text-secondary' },
];

/**
 * Admin Dashboard — trang tổng quan quản trị
 * Route: /admin
 * Layout: AdminLayout
 */
export default function Dashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">Dashboard</h1>
        <p className="text-sm text-on-surface-variant mt-1">Chào mừng trở lại, V-Shop Admin!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl p-5 border border-outline-variant shadow-sm flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">{label}</p>
              <p className="text-xl font-bold text-on-surface mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for charts */}
      <div className="mt-6 bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
        <h2 className="font-semibold text-on-surface mb-4">Biểu đồ doanh thu</h2>
        <div className="h-48 flex items-center justify-center bg-surface rounded-lg">
          <p className="text-on-surface-variant text-sm">Biểu đồ sẽ được tích hợp sau</p>
        </div>
      </div>
    </div>
  );
}

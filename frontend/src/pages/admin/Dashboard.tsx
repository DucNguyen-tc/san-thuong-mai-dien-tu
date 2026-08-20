import { useEffect, useState } from 'react';
import { BarChart3, ShoppingBag, Users, DollarSign } from 'lucide-react';
import { getDashboardStats } from '../../services/dashboardService';
import type { DashboardStats } from '../../services/dashboardService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatPrice } from '../../utils/formatters';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Tổng Doanh Thu', value: formatPrice(stats?.totalRevenue || 0), icon: DollarSign, color: 'bg-green-100 text-green-600' },
    { label: 'Tổng Đơn Hàng', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'bg-primary/10 text-primary' },
    { label: 'Khách Hàng', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Doanh Thu 7 Ngày', value: formatPrice(stats?.recentStats.reduce((acc, curr) => acc + curr.revenue, 0) || 0), icon: BarChart3, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Tổng Quan Hệ Thống</h1>
          <p className="text-sm text-on-surface-variant mt-2 opacity-80">Theo dõi hiệu suất và tăng trưởng kinh doanh</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ label, value, icon: Icon, color }, index) => (
          <div
            key={label}
            className="group relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-on-surface-variant mb-1">{label}</p>
                <p className="text-2xl font-black text-on-surface">{value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${color} transition-transform group-hover:scale-110`}>
                <Icon size={24} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/50 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-primary rounded-full"></span>
            Biểu Đồ Doanh Thu
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.recentStats || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis 
                  tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value} 
                  allowDecimals={false} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }} 
                />
                <Tooltip 
                  formatter={(value: any) => [formatPrice(value), 'Doanh thu']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/50 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-secondary rounded-full"></span>
            Biểu Đồ Đơn Hàng
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.recentStats || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="orders" name="Đơn hàng" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products Tables */}
      <div className="mt-6">
        {/* Top Selling */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/50 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-primary rounded-full"></span>
            Top 10 Sản Phẩm Bán Chạy
          </h2>
          <div className="max-h-[350px] overflow-y-auto overflow-x-auto pr-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant text-sm text-on-surface-variant">
                  <th className="pb-3 font-medium">Sản phẩm</th>
                  <th className="pb-3 font-medium text-right">Đã bán</th>
                  <th className="pb-3 font-medium text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topSellingProducts?.length ? (
                  stats.topSellingProducts.map((product) => (
                    <tr key={product.id} className="border-b border-outline-variant/50 last:border-0 hover:bg-surface/50 transition-colors">
                      <td className="py-3 text-sm text-on-surface font-medium truncate max-w-[400px]" title={product.name}>{product.name}</td>
                      <td className="py-3 text-sm text-on-surface text-right">{product.soldCount}</td>
                      <td className="py-3 text-sm text-primary font-semibold text-right">{formatPrice(product.revenue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-on-surface-variant">Chưa có dữ liệu</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

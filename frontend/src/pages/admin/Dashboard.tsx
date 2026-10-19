import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  DollarSign,
  Send,
  Download,
  Flame,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  CreditCard,
  RefreshCw,
  Award,
  Bot,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getDashboardStats,
  sendTelegramReport,
  type DashboardStats,
  type DashboardFilterParams,
} from '../../services/dashboardService';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { formatPrice } from '../../utils/formatters';

type PresetPeriod = 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'custom';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<PresetPeriod>('30days');
  const [customMode, setCustomMode] = useState<'single' | 'range'>('single');
  const [singleDate, setSingleDate] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sendingTelegram, setSendingTelegram] = useState(false);

  const fetchStats = async (params: DashboardFilterParams) => {
    try {
      setLoading(true);
      const data = await getDashboardStats(params);
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats', error);
      toast.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterPeriod !== 'custom') {
      fetchStats({ period: filterPeriod });
    }
  }, [filterPeriod]);

  const handleApplySingleDate = () => {
    if (!singleDate) {
      toast.error('Vui lòng chọn ngày cần xem');
      return;
    }
    fetchStats({
      startDate: singleDate,
      endDate: singleDate,
    });
  };

  const handleApplyRangeDate = () => {
    if (!customStartDate) {
      toast.error('Vui lòng chọn ngày bắt đầu');
      return;
    }
    fetchStats({
      startDate: customStartDate,
      endDate: customEndDate || customStartDate,
    });
  };

  const handleSendTelegram = async () => {
    try {
      setSendingTelegram(true);
      const currentStart = stats?.dateRange?.startDate;
      const currentEnd = stats?.dateRange?.endDate;

      await sendTelegramReport({
        startDate: currentStart,
        endDate: currentEnd,
      });
      toast.success('Đã gửi báo cáo trực tiếp đến Telegram Admin!');
    } catch (error: any) {
      console.error('Failed to send report to Telegram:', error);
      toast.error('Gửi báo cáo qua Telegram thất bại');
    } finally {
      setSendingTelegram(false);
    }
  };

  const handleExportCsv = () => {
    if (!stats) return;

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'BÁO CÁO THỐNG KÊ DOANH THU & ĐƠN HÀNG\n';
    csvContent += `Khoảng thời gian: ${formatVN(stats.dateRange?.startDate)} đến ${formatVN(stats.dateRange?.endDate)}\n`;
    csvContent += `Tổng doanh thu: ${stats.totalRevenue} đ\n`;
    csvContent += `Tổng đơn hàng: ${stats.totalOrders} đơn\n\n`;

    csvContent += '1. DOANH THU THEO TỪNG NGÀY\n';
    csvContent += 'Ngày,Doanh thu (VNĐ),Số đơn hàng\n';
    stats.recentStats.forEach((r) => {
      csvContent += `${formatVN(r.date)},${r.revenue},${r.orders}\n`;
    });

    csvContent += '\n2. TOP SẢN PHẨM BÁN CHẠY TRONG KỲ\n';
    csvContent += 'Tên sản phẩm,Số lượng đã bán,Doanh thu (VNĐ)\n';
    stats.topSellingProducts.forEach((p) => {
      csvContent += `"${p.name.replace(/"/g, '""')}",${p.soldCount},${p.revenue}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Bao_cao_kinh_doanh_${formatVN(stats.dateRange?.startDate).replace(/\//g, '-')}_den_${formatVN(stats.dateRange?.endDate).replace(/\//g, '-')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất file báo cáo CSV thành công!');
  };

  const handlePeriodChange = (period: PresetPeriod) => {
    setFilterPeriod(period);
    if (period === 'custom') {
      const defaultDate = stats?.dateRange?.startDate || new Date().toISOString().split('T')[0];
      if (!singleDate) setSingleDate(defaultDate);
      if (!customStartDate) setCustomStartDate(defaultDate);
      if (!customEndDate) setCustomEndDate(stats?.dateRange?.endDate || defaultDate);
    }
  };

  const formatVN = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  const peakRevenueText = useMemo(() => {
    if (!stats?.peakRevenueDay || !stats.peakRevenueDay.revenue) {
      return 'Chưa có phát sinh';
    }
    return `${formatShortDate(stats.peakRevenueDay.date)}: ${formatPrice(stats.peakRevenueDay.revenue)}`;
  }, [stats]);

  const statCards = [
    {
      label: 'Tổng Doanh Thu',
      value: formatPrice(stats?.totalRevenue || 0),
      subtext: `Hoàn tất: ${formatPrice(stats?.completedRevenue || 0)}`,
      icon: DollarSign,
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    {
      label: 'Tổng Đơn Hàng',
      value: `${stats?.totalOrders || 0} đơn`,
      subtext: `Tỷ lệ thành công: ${stats?.successRate || 0}%`,
      icon: ShoppingBag,
      color: 'bg-primary/10 text-primary dark:bg-indigo-950/60 dark:text-indigo-400',
    },
    {
      label: 'Đỉnh Doanh Thu / Ngày',
      value: peakRevenueText,
      subtext: stats?.peakRevenueDay?.orders ? `Kỷ lục: ${stats.peakRevenueDay.orders} đơn/ngày` : 'Giai đoạn chọn',
      icon: Flame,
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    },
    {
      label: 'Giá Trị TB Đơn (AOV)',
      value: formatPrice(stats?.averageOrderValue || 0),
      subtext: 'Doanh thu trung bình/đơn',
      icon: Award,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
              Báo Cáo Doanh Thu
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Thời gian thực
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5 opacity-75">
            Theo dõi doanh thu, dòng tiền và hiệu suất bán hàng
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCsv}
            disabled={loading || !stats}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-outline-variant/60 text-on-surface font-medium text-xs shadow-xs hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all cursor-pointer whitespace-nowrap"
            title="Xuất file CSV báo cáo"
          >
            <Download size={13} className="text-neutral-500" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={handleSendTelegram}
            disabled={sendingTelegram || loading || !stats}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-medium text-xs shadow-xs shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            title="Gửi báo cáo đang xem qua Telegram"
          >
            {sendingTelegram ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Send size={13} className="transform -rotate-12" />
            )}
            <span>Gửi Telegram</span>
          </button>

          <Link
            to="/admin/telegram"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-on-surface font-medium text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all whitespace-nowrap"
            title="Cấu hình Telegram Bot"
          >
            <Bot size={13} className="text-neutral-500" />
            <span>Bot</span>
          </Link>
        </div>
      </div>

      {/* Modern Filter Toolbar Card */}
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-outline-variant/60 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Presets */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl border border-outline-variant/30 overflow-x-auto scrollbar-none">
            {[
              { id: 'today', label: 'Hôm nay' },
              { id: 'yesterday', label: 'Hôm qua' },
              { id: '7days', label: '7 ngày' },
              { id: '30days', label: '30 ngày' },
              { id: 'this_month', label: 'Tháng này' },
              { id: 'custom', label: 'Tùy chọn' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handlePeriodChange(item.id as PresetPeriod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filterPeriod === item.id
                    ? 'bg-white dark:bg-neutral-900 text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Active Range Pill */}
          {stats?.dateRange && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-outline-variant/30 text-xs text-on-surface-variant font-medium self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-on-surface">
                {formatVN(stats.dateRange.startDate)}
                {stats.dateRange.startDate !== stats.dateRange.endDate && ` – ${formatVN(stats.dateRange.endDate)}`}
              </span>
              <span className="text-[11px] px-1.5 py-0.5 bg-neutral-200/70 dark:bg-neutral-700/60 rounded-md text-on-surface-variant">
                {stats.dateRange.daysCount} ngày
              </span>
            </div>
          )}
        </div>

        {/* Custom Date Range Panel (Smooth drop-down when 'Tùy chọn' is selected) */}
        {filterPeriod === 'custom' && (
          <div className="mt-3 pt-3 border-t border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Mode Toggle: 1 Ngày vs Khoảng Ngày */}
              <div className="inline-flex p-0.5 bg-neutral-200/80 dark:bg-neutral-800 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCustomMode('single')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    customMode === 'single'
                      ? 'bg-white dark:bg-neutral-900 text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Xem 1 ngày cụ thể
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMode('range')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    customMode === 'range'
                      ? 'bg-white dark:bg-neutral-900 text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Xem theo khoảng ngày
                </button>
              </div>

              {/* Mode 1: Chọn đúng 1 ngày cụ thể */}
              {customMode === 'single' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant font-medium">Chọn ngày:</span>
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-neutral-900 border border-outline-variant/60 text-on-surface outline-none focus:border-primary shadow-xs"
                    title="Chọn một ngày cụ thể"
                  />
                  <button
                    onClick={handleApplySingleDate}
                    className="px-3.5 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                  >
                    Xem ngày này
                  </button>
                </div>
              ) : (
                /* Mode 2: Chọn khoảng ngày */
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-on-surface-variant font-medium">Từ ngày:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-neutral-900 border border-outline-variant/60 text-on-surface outline-none focus:border-primary shadow-xs"
                    title="Từ ngày"
                  />
                  <span className="text-xs text-on-surface-variant font-bold">➔</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-neutral-900 border border-outline-variant/60 text-on-surface outline-none focus:border-primary shadow-xs"
                    title="Đến ngày"
                  />
                  <button
                    onClick={handleApplyRangeDate}
                    className="px-3.5 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                  >
                    Lọc khoảng này
                  </button>
                </div>
              )}
            </div>

            <span className="text-[11px] text-on-surface-variant/70 italic">
              {customMode === 'single'
                ? 'Báo cáo doanh thu & đơn hàng phát sinh trong đúng 1 ngày được chọn'
                : 'Báo cáo tổng hợp từ ngày bắt đầu đến ngày kết thúc'}
            </span>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center items-center h-48 bg-white/40 dark:bg-neutral-900/40 rounded-2xl backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="animate-spin text-primary" size={28} />
            <span className="text-xs text-on-surface-variant font-medium">Đang trích xuất dữ liệu đa chiều...</span>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(({ label, value, subtext, icon: Icon, color }, index) => (
              <div
                key={label}
                className="group relative overflow-hidden bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-outline-variant/60 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full opacity-40 pointer-events-none"></div>
                <div className="flex justify-between items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-on-surface-variant mb-1 truncate">{label}</p>
                    <p className="text-lg xl:text-xl font-bold text-on-surface truncate tracking-tight">{value}</p>
                    <p className="text-[11px] text-on-surface-variant/70 mt-1 truncate">{subtext}</p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${color} transition-transform group-hover:scale-105`}
                  >
                    <Icon size={20} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Analytics Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status Breakdown */}
            <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg rounded-2xl border border-outline-variant/60 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-on-surface mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-primary" />
                  Cơ Cấu Trạng Thái Đơn Hàng ({stats?.totalOrders || 0} đơn)
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  Thành công: {stats?.successRate || 0}%
                </span>
              </h2>

              <div className="space-y-3">
                {[
                  {
                    label: 'Đã hoàn tất (Completed)',
                    count: stats?.statusBreakdown?.completed || 0,
                    icon: CheckCircle2,
                    color: 'text-emerald-600 bg-emerald-500',
                  },
                  {
                    label: 'Đang vận chuyển (Shipping)',
                    count: stats?.statusBreakdown?.shipping || 0,
                    icon: Truck,
                    color: 'text-purple-600 bg-purple-500',
                  },
                  {
                    label: 'Đã xác nhận (Confirmed)',
                    count: stats?.statusBreakdown?.confirmed || 0,
                    icon: CheckCircle2,
                    color: 'text-blue-600 bg-blue-500',
                  },
                  {
                    label: 'Chờ thanh toán (Pending)',
                    count: stats?.statusBreakdown?.pendingPayment || 0,
                    icon: Clock,
                    color: 'text-amber-600 bg-amber-500',
                  },
                  {
                    label: 'Đã hủy đơn (Cancelled)',
                    count: stats?.statusBreakdown?.cancelled || 0,
                    icon: XCircle,
                    color: 'text-rose-600 bg-rose-500',
                  },
                ].map((item) => {
                  const total = stats?.totalOrders || 1;
                  const pct = Math.round((item.count / total) * 100);
                  const IconComp = item.icon;
                  return (
                    <div key={item.label} className="text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                          <IconComp size={13} className={item.color.split(' ')[0]} />
                          {item.label}
                        </span>
                        <span className="font-bold text-on-surface">
                          {item.count} đơn ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color.split(' ')[1]}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg rounded-2xl border border-outline-variant/60 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-indigo-600" />
                Phương Thức Thanh Toán Hợp Lệ
              </h2>

              <div className="space-y-4">
                {stats?.paymentBreakdown && stats.paymentBreakdown.length > 0 ? (
                  stats.paymentBreakdown.map((pm) => {
                    const isVnPay = pm.method === 'VNPAY';
                    const isMoMo = pm.method === 'MOMO';
                    const badgeColor = isVnPay
                      ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400'
                      : isMoMo
                      ? 'bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-950/60 dark:text-pink-400'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400';
                    const barColor = isVnPay ? 'bg-blue-500' : isMoMo ? 'bg-pink-500' : 'bg-emerald-500';

                    return (
                      <div
                        key={pm.method}
                        className="p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-outline-variant/40"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                            {pm.method}
                          </span>
                          <span className="text-xs font-bold text-on-surface">
                            {formatPrice(pm.totalAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-on-surface-variant mb-1.5">
                          <span>{pm.count} giao dịch thành công</span>
                          <span className="font-semibold">{pm.percentage}% doanh thu</span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pm.percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-on-surface-variant">Chưa có giao dịch thanh toán trong kỳ</div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Area Chart */}
            <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg rounded-2xl border border-outline-variant/60 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="w-2 h-4 bg-primary rounded-full"></span>
                  Biểu Đồ Doanh Thu Theo Ngày
                </h2>
                {stats?.peakRevenueDay?.revenue ? (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md font-semibold">
                    Đỉnh: {formatShortDate(stats.peakRevenueDay.date)} ({formatPrice(stats.peakRevenueDay.revenue)})
                  </span>
                ) : null}
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.recentStats || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.6} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={formatShortDate}
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        value >= 1000000
                          ? `${(value / 1000000).toFixed(1)}M`
                          : value >= 1000
                          ? `${(value / 1000).toFixed(0)}K`
                          : value
                      }
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                    />
                    <Tooltip
                      labelFormatter={(label) => `Ngày: ${formatVN(String(label))}`}
                      formatter={(value: any) => [formatPrice(Number(value)), 'Doanh thu']}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4F46E5"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Orders Trend Bar Chart */}
            <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg rounded-2xl border border-outline-variant/60 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="w-2 h-4 bg-emerald-500 rounded-full"></span>
                  Biểu Đồ Số Lượng Đơn Hàng
                </h2>
                {stats?.peakOrdersDay?.orders ? (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-semibold">
                    Đỉnh: {formatShortDate(stats.peakOrdersDay.date)} ({stats.peakOrdersDay.orders} đơn)
                  </span>
                ) : null}
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.recentStats || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.6} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={formatShortDate}
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                    />
                    <Tooltip
                      labelFormatter={(label) => `Ngày: ${formatVN(String(label))}`}
                      formatter={(value: any) => [`${value} đơn`, 'Số đơn']}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="orders" name="Đơn hàng" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Selling Products in Range */}
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg rounded-2xl border border-outline-variant/60 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <Award size={18} className="text-amber-500" />
                  Top 10 Sản Phẩm Bán Chạy Nhất Trong Kỳ Lọc
                </h2>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Xếp hạng theo sản lượng đã bán và doanh thu đóng góp trong khoảng thời gian đang chọn
                </p>
              </div>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {stats?.topSellingProducts?.length || 0} sản phẩm ghi nhận
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/60 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3 w-16">Thứ hạng</th>
                    <th className="py-2.5 px-3">Sản phẩm</th>
                    <th className="py-2.5 px-3 text-right">Đã bán</th>
                    <th className="py-2.5 px-3 text-right">Doanh thu</th>
                    <th className="py-2.5 px-3 w-36 text-right">Tỷ trọng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40 text-xs">
                  {stats?.topSellingProducts?.length ? (
                    stats.topSellingProducts.map((product, idx) => {
                      const totalRev = stats.totalRevenue || 1;
                      const sharePct = Math.round((product.revenue / totalRev) * 100);
                      const isTop1 = idx === 0;

                      return (
                        <tr
                          key={product.id || idx}
                          className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/60 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                isTop1
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 ring-2 ring-amber-400'
                                  : idx === 1
                                  ? 'bg-neutral-200 text-neutral-700 font-bold'
                                  : idx === 2
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'text-on-surface-variant'
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-on-surface max-w-md truncate" title={product.name}>
                              {product.name}
                            </div>
                            <div className="text-[10px] text-on-surface-variant font-mono mt-0.5 opacity-60">
                              ID: {product.id ? product.id.split('-')[0].toUpperCase() : 'N/A'}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-on-surface">
                            {product.soldCount} <span className="text-[10px] text-on-surface-variant font-normal">món</span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-primary">
                            {formatPrice(product.revenue)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(5, sharePct))}%` }}
                                ></div>
                              </div>
                              <span className="font-semibold text-[11px] w-8 text-right text-on-surface-variant">
                                {sharePct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-on-surface-variant">
                        Không có phát sinh sản phẩm bán ra trong khoảng thời gian này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

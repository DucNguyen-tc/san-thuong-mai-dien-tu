import { useState, useEffect, useCallback } from 'react';
import {
  Send,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Radio,
  FileText,
  TrendingUp,
  CreditCard,
  Package,
  ExternalLink,
  Info,
  Terminal,
  ShieldCheck,
  Edit3,
  X,
  Calendar,
} from 'lucide-react';
import {
  telegramService,
  type TelegramStatusData,
  type PreviewReportResponse,
} from '@/services/telegramService';
import { formatPrice } from '@/utils/formatters';

function formatCronSchedule(cronStr?: string): string {
  if (!cronStr) return '23:00 mỗi đêm';
  const parts = cronStr.trim().split(/\s+/);
  if (parts.length >= 2) {
    const minute = parts[0].padStart(2, '0');
    const hour = parts[1].padStart(2, '0');
    if (!isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      return `${hour}:${minute} mỗi ngày`;
    }
  }
  return cronStr;
}

function parseCronToTime(cronStr?: string): string {
  if (!cronStr) return '23:00';
  const parts = cronStr.trim().split(/\s+/);
  if (parts.length >= 2) {
    const minute = parts[0].padStart(2, '0');
    const hour = parts[1].padStart(2, '0');
    if (!isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      return `${hour}:${minute}`;
    }
  }
  return '23:00';
}

const CRON_PRESETS = [
  { label: '07:00 (Sáng sớm)', time: '07:00', cron: '0 7 * * *' },
  { label: '12:00 (Nghỉ trưa)', time: '12:00', cron: '0 12 * * *' },
  { label: '18:00 (Cuối chiều)', time: '18:00', cron: '0 18 * * *' },
  { label: '21:00 (Buổi tối)', time: '21:00', cron: '0 21 * * *' },
  { label: '23:00 (Đêm chốt ca)', time: '23:00', cron: '0 23 * * *' },
];

export default function TelegramMonitoring() {
  const [status, setStatus] = useState<TelegramStatusData | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Date picker for preview (format YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [preview, setPreview] = useState<PreviewReportResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(true);

  // Actions state
  const [sendingReport, setSendingReport] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Cron schedule edit state
  const [isEditingCron, setIsEditingCron] = useState<boolean>(false);
  const [cronTimeInput, setCronTimeInput] = useState<string>('23:00');
  const [customCronInput, setCustomCronInput] = useState<string>('0 23 * * *');
  const [useAdvancedCron, setUseAdvancedCron] = useState<boolean>(false);
  const [savingCron, setSavingCron] = useState<boolean>(false);

  // Active view tab for report preview
  const [previewTab, setPreviewTab] = useState<'visual' | 'telegram'>('visual');

  // Load Bot Status
  const fetchStatus = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await telegramService.getStatus();
      setStatus(data);
      if (data?.cronExpression) {
        setCronTimeInput(parseCronToTime(data.cronExpression));
        setCustomCronInput(data.cronExpression);
      }
    } catch (err: any) {
      console.error('Lỗi khi lấy trạng thái Telegram:', err);
    } finally {
      setLoadingStatus(false);
      setRefreshing(false);
    }
  }, []);

  // Handle Save Cron Schedule
  const handleSaveCron = async () => {
    setSavingCron(true);
    setNotification(null);
    try {
      const payload = useAdvancedCron
        ? { cronExpression: customCronInput.trim() }
        : { time: cronTimeInput.trim() };

      const res = await telegramService.updateCronSchedule(payload);
      setStatus((prev) => (prev ? { ...prev, cronExpression: res.cronExpression } : null));
      setIsEditingCron(false);
      setNotification({
        type: 'success',
        message: `Đã cập nhật lịch phát báo cáo thành công: ${formatCronSchedule(res.cronExpression)} (${res.cronExpression})`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Lỗi cập nhật lịch trình: ${err.response?.data?.message || err.message}`,
      });
    } finally {
      setSavingCron(false);
    }
  };

  // Load Preview Report
  const fetchPreview = useCallback(async (date: string) => {
    try {
      setLoadingPreview(true);
      const data = await telegramService.previewReport(date);
      setPreview(data);
    } catch (err: any) {
      console.error('Lỗi khi tải bản xem trước báo cáo:', err);
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    fetchPreview(selectedDate);
  }, [selectedDate, fetchPreview]);

  // Handle Send Report Now
  const handleSendReport = async () => {
    if (sendingReport) return;
    setSendingReport(true);
    setNotification(null);
    try {
      const res = await telegramService.sendReport(selectedDate);
      setNotification({
        type: 'success',
        message: `Đã gửi báo cáo ngày ${selectedDate} thành công lên Telegram! (Message ID: #${res.messageId || 'OK'})`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Gửi báo cáo thất bại: ${err.response?.data?.message || err.message}`,
      });
    } finally {
      setSendingReport(false);
    }
  };

  const summary = preview?.summary;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-purple-900/10 p-4.5 rounded-3xl border border-blue-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25 shrink-0">
            <Send size={18} className="transform -rotate-12 translate-x-0.5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-on-surface tracking-tight">
                Trung Tâm Giám Sát & Báo Cáo Telegram
              </h1>
              <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300/40 whitespace-nowrap">
                Operations & Saga Watchdog
              </span>
            </div>
            <p className="text-[11.5px] text-on-surface-variant opacity-80 mt-0.5">
              Giám sát vi dịch vụ, tự động hóa báo cáo doanh thu & cảnh báo giao dịch phân tán Saga thời gian thực.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            onClick={fetchStatus}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-outline-variant hover:bg-neutral-50 dark:hover:bg-neutral-700/50 text-xs font-medium transition-all shadow-sm cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-sky-600' : ''} />
            <span>Làm mới trạng thái</span>
          </button>
        </div>
      </div>

      {/* Alert Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm animate-in fade-in slide-in-from-top-2 border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
              : 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800'
          }`}
        >
          <div className="flex items-center gap-2.5 font-medium">
            {notification.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 font-semibold px-2 py-1 rounded-md"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Grid: Bot Status & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Bot Connection Status */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-3xl p-6 border border-outline-variant/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-bold text-on-surface-variant flex items-center gap-1.5">
                <Radio size={14} className="text-sky-500 animate-pulse" />
                Hạ Tầng Kết Nối Telegram
              </span>
              {status?.isConfigured && status?.botPollingRunning ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/50">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Đang hoạt động (Polling Online)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  Chưa kích hoạt
                </span>
              )}
            </div>

            {loadingStatus ? (
              <div className="py-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="p-4 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700/60 flex flex-col justify-between transition-all hover:border-neutral-300 dark:hover:border-neutral-600">
                  <div>
                    <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      Tên Bot & Username
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-sm sm:text-base font-bold text-on-surface">
                        {status?.botInfo?.first_name || 'Chưa nhận diện'}
                      </span>
                      {status?.botInfo?.username && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-sky-100/80 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60 font-medium">
                          @{status.botInfo.username}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant/80 mt-2.5 pt-2 border-t border-neutral-200/40 dark:border-neutral-700/40 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>ID: {status?.botInfo?.id || 'N/A'} • Long-Polling 2 chiều</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700/60 flex flex-col justify-between transition-all hover:border-indigo-300/60 dark:hover:border-indigo-700/60 group">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                        Lập Lịch Báo Cáo
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingCron(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900/80 border border-indigo-200/80 dark:border-indigo-800/80 transition-all cursor-pointer shadow-xs hover:shadow-sm hover:scale-[1.02] active:scale-95 whitespace-nowrap shrink-0"
                      >
                        <Edit3 size={11} className="text-indigo-600 dark:text-indigo-400" />
                        <span>Đổi giờ</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-on-surface">
                        <Clock size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>{formatCronSchedule(status?.cronExpression)}</span>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 font-medium">
                        {status?.cronExpression || '0 23 * * *'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-on-surface-variant/80 mt-2.5 pt-2 border-t border-neutral-200/40 dark:border-neutral-700/40 flex items-center justify-between">
                    <span>Admin Chat ID: {status?.defaultChatId || 'Đã cấu hình'}</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Tự động hàng ngày</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-outline-variant/40 flex items-center justify-between text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-500" />
              Chat ID Whitelisting & Exponential Backoff bảo mật 100%
            </span>
            {status?.botInfo?.username && (
              <a
                href={`https://t.me/${status.botInfo.username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold hover:underline"
              >
                Mở Bot trên Telegram
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {/* Card 2: Interactive Controls */}
        <div className="bg-gradient-to-br from-slate-900 via-neutral-900 to-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal size={16} className="text-sky-400" />
              <h2 className="text-sm font-bold tracking-tight">Kích Hoạt Tác Vụ Tức Thì</h2>
            </div>
            <p className="text-[11.5px] text-neutral-400 leading-relaxed mb-4">
              Kích hoạt phát báo cáo kinh doanh tổng hợp tức thời tới quản trị viên qua Telegram.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleSendReport}
                disabled={sendingReport || !status?.isConfigured}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-sky-500/20 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {sendingReport ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Đang gửi báo cáo...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Gửi Báo Cáo Doanh Thu Ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-neutral-800 text-[10.5px] text-neutral-400 flex items-center gap-1.5">
            <Info size={12} className="text-sky-400 shrink-0" />
            <span>Tin nhắn gửi trực tiếp đến Telegram quản trị viên.</span>
          </div>
        </div>
      </div>

      {/* Section: Live Preview of Daily Business Intelligence Report */}
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/40">
          <div>
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <FileText size={20} className="text-indigo-600" />
              Xem Trước Dữ Liệu Báo Cáo Doanh Thu (Live Preview)
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Trích xuất trực tiếp số liệu từ PostgreSQL cho ngày được chọn
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
              <span>Chọn ngày:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-outline-variant bg-surface-container-low text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            {/* Tab switch */}
            <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
              <button
                onClick={() => setPreviewTab('visual')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  previewTab === 'visual'
                    ? 'bg-white dark:bg-neutral-700 text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Biểu đồ số liệu
              </button>
              <button
                onClick={() => setPreviewTab('telegram')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  previewTab === 'telegram'
                    ? 'bg-white dark:bg-neutral-700 text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Mô phỏng tin nhắn Telegram
              </button>
            </div>
          </div>
        </div>

        {loadingPreview ? (
          <div className="py-16 flex flex-col justify-center items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-xs text-on-surface-variant">Đang trích xuất số liệu từ database...</p>
          </div>
        ) : summary ? (
          <div>
            {/* 4 KPI Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Doanh thu thực nhận</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatPrice(summary.completedRevenue || 0)}
                </p>
                <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/70 mt-1">
                  Đơn đã giao hoàn tất
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <p className="text-xs font-medium text-sky-700 dark:text-sky-300">Tổng đơn phát sinh</p>
                <p className="text-xl font-black text-sky-600 dark:text-sky-400 mt-1">
                  {summary.totalOrders} đơn
                </p>
                <p className="text-[11px] text-sky-700/70 dark:text-sky-400/70 mt-1">
                  Trong ngày {summary.reportDateStr}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Tỷ lệ đơn tích cực</p>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {summary.successRate}%
                </p>
                <p className="text-[11px] text-indigo-700/70 dark:text-indigo-400/70 mt-1">
                  (Hoàn tất + Xác nhận + Ship)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Giá trị đơn đang chạy</p>
                <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
                  {formatPrice(summary.grossRevenue || 0)}
                </p>
                <p className="text-[11px] text-purple-700/70 dark:text-purple-400/70 mt-1">
                  Chờ xử lý / Đang ship
                </p>
              </div>
            </div>

            {previewTab === 'visual' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phân bổ thanh toán */}
                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-outline-variant/60 space-y-4">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <CreditCard size={16} className="text-sky-500" />
                    Phân Bổ Phương Thức Thanh Toán Hợp Lệ
                  </h3>
                  <div className="space-y-2">
                    {summary.paymentBreakdown && summary.paymentBreakdown.length > 0 ? (
                      summary.paymentBreakdown.map((item) => (
                        <div
                          key={item.method}
                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-neutral-900 border border-outline-variant/40"
                        >
                          <span className="text-xs font-semibold text-on-surface">
                            {item.method === 'VNPAY'
                              ? '💳 Cổng VNPAY'
                              : item.method === 'MOMO'
                              ? '📱 Ví MoMo'
                              : '💵 Tiền mặt (COD)'}
                          </span>
                          <div className="text-right">
                            <span className="text-xs font-bold text-primary">
                              {formatPrice(item.totalAmount)}
                            </span>
                            <span className="text-[11px] text-on-surface-variant block">
                              ({item.count} đơn)
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-on-surface-variant italic py-4 text-center">
                        Chưa có đơn hàng phát sinh trong ngày này.
                      </p>
                    )}
                  </div>
                </div>

                {/* Top 5 sản phẩm bán chạy */}
                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-outline-variant/60 space-y-4">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <TrendingUp size={16} className="text-amber-500" />
                    Top Sản Phẩm Bán Chạy Nhất Trong Ngày
                  </h3>
                  <div className="space-y-2">
                    {summary.topProducts && summary.topProducts.length > 0 ? (
                      summary.topProducts.map((p, idx) => (
                        <div
                          key={p.productId}
                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-neutral-900 border border-outline-variant/40"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-black flex items-center justify-center">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-on-surface line-clamp-1">
                                {p.name}
                              </p>
                              <p className="text-[11px] text-on-surface-variant">
                                Đã bán: <b className="text-on-surface">{p.quantity}</b> cái
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {formatPrice(p.revenue)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-on-surface-variant italic py-4 text-center">
                        Chưa có sản phẩm nào được bán ra trong ngày này.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Telegram Chat Bubble Simulator */
              <div className="p-6 rounded-2xl bg-[#0e1621] text-white font-sans max-w-2xl mx-auto shadow-2xl border border-sky-500/20">
                <div className="flex items-center gap-3 pb-3 mb-3 border-b border-white/10 text-xs text-sky-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold">
                    🤖
                  </div>
                  <div>
                    <p className="font-bold text-white">Sàn TMĐT Admin Bot</p>
                    <p className="text-[11px] text-neutral-400">bot • vừa xong</p>
                  </div>
                </div>

                <div
                  className="text-sm leading-relaxed whitespace-pre-wrap font-sans space-y-2 select-text"
                  dangerouslySetInnerHTML={{
                    __html: (preview?.formattedHtml || '')
                      .replace(/<b>/g, '<strong class="font-bold text-white">')
                      .replace(/<\/b>/g, '</strong>')
                      .replace(/<code>/g, '<code class="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono text-xs">')
                      .replace(/<\/code>/g, '</code>')
                      .replace(/<i>/g, '<em class="italic text-neutral-300">')
                      .replace(/<\/i>/g, '</em>'),
                  }}
                />
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Card 4: Telegram Slash Commands Reference */}
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-3xl p-6 border border-outline-variant/60 shadow-sm">
        <h2 className="text-base font-bold text-on-surface flex items-center gap-2 mb-4">
          <Package size={18} className="text-primary" />
          Sổ Tay Câu Lệnh Điều Hành Trên Ứng Dụng Telegram
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { cmd: '/start', desc: 'Menu chào mừng & danh mục trợ giúp' },
            { cmd: '/report', desc: 'Báo cáo doanh thu & đơn hàng hôm nay' },
            { cmd: '/report yesterday', desc: 'Xem lại toàn bộ số liệu ngày hôm qua' },
            { cmd: '/report <ngày-tháng-năm>', desc: 'Báo cáo 1 ngày cụ thể (VD: /report 17-10-2026)' },
            { cmd: '/order <mã_đơn>', desc: 'Tra cứu trạng thái & chi tiết đơn hàng (VD: /order 6ff9b54b)' },
          ].map((item) => (
            <div
              key={item.cmd}
              className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-outline-variant/40 flex flex-col justify-between"
            >
              <code className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-1 rounded-md w-fit">
                {item.cmd}
              </code>
              <p className="text-xs text-on-surface-variant mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Đổi Giờ Lập Lịch Báo Cáo */}
      {isEditingCron && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Cài Đặt Giờ Báo Cáo Tự Động</h3>
                  <p className="text-[11px] text-on-surface-variant">Lập lịch gửi tin nhắn tổng hợp lên Telegram</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingCron(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-[11.5px] font-semibold text-on-surface-variant">
                Khung giờ gợi ý nhanh:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CRON_PRESETS.map((preset) => {
                  const isSelected = !useAdvancedCron && cronTimeInput === preset.time;
                  return (
                    <button
                      key={preset.time}
                      type="button"
                      onClick={() => {
                        setCronTimeInput(preset.time);
                        setCustomCronInput(preset.cron);
                        setUseAdvancedCron(false);
                      }}
                      className={`text-[11px] px-2.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-on-surface hover:bg-neutral-200 dark:hover:bg-neutral-700 border-transparent'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Picker Mode */}
            {!useAdvancedCron ? (
              <div className="space-y-2">
                <label className="text-[11.5px] font-semibold text-on-surface-variant">
                  Chọn giờ chính xác (HH:mm):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={cronTimeInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCronTimeInput(val);
                      if (val) {
                        const [h, m] = val.split(':');
                        setCustomCronInput(`${parseInt(m, 10)} ${parseInt(h, 10)} * * *`);
                      }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-base font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="text-xs text-on-surface-variant font-medium px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    Cron: <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{customCronInput}</code>
                  </div>
                </div>
              </div>
            ) : (
              /* Advanced Cron Expression Mode */
              <div className="space-y-2">
                <label className="text-[11.5px] font-semibold text-on-surface-variant flex items-center justify-between">
                  <span>Cú pháp Cron (phút giờ ngày tháng thứ):</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Chuẩn 5 trường</span>
                </label>
                <input
                  type="text"
                  value={customCronInput}
                  onChange={(e) => setCustomCronInput(e.target.value)}
                  placeholder="0 23 * * *"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Toggle Mode */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useAdvancedCron}
                  onChange={(e) => setUseAdvancedCron(e.target.checked)}
                  className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Nhập biểu thức Cron nâng cao</span>
              </label>
            </div>

            {/* Helper Info */}
            <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-[11.5px] text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
              <Info size={14} className="text-indigo-500 mt-0.5 shrink-0" />
              <span>
                Báo cáo doanh thu sẽ được tự động trích xuất và phát qua Telegram vào lúc{' '}
                <strong className="underline">{useAdvancedCron ? customCronInput : `${cronTimeInput} mỗi ngày`}</strong>.
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingCron(false)}
                disabled={savingCron}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 transition-all cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveCron}
                disabled={savingCron}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingCron ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>Lưu Lịch Trình</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

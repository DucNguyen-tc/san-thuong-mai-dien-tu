import { apiClient } from '@/lib/api-client';

export interface TelegramBotInfo {
  id: number;
  username: string;
  first_name: string;
}

export interface TelegramStatusData {
  isConfigured: boolean;
  botInfo: TelegramBotInfo | null;
  defaultChatId: string;
  botPollingRunning: boolean;
  cronRunning: boolean;
  cronExpression: string;
}

export interface ReportTopProduct {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  count: number;
  totalAmount: number;
}

export interface DailyReportSummary {
  reportDateStr: string;
  generatedAtStr: string;
  totalOrders: number;
  completedOrders: number;
  confirmedOrders: number;
  shippingOrders: number;
  pendingPaymentOrders: number;
  cancelledOrders: number;
  successRate: number;
  completedRevenue: number;
  grossRevenue: number;
  topProducts: ReportTopProduct[];
  paymentBreakdown: PaymentMethodBreakdown[];
}

export interface PreviewReportResponse {
  summary: DailyReportSummary;
  formattedHtml: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const telegramService = {
  /**
   * Lấy trạng thái hoạt động của Telegram Bot và Cron Job
   */
  async getStatus(): Promise<TelegramStatusData> {
    const res = await apiClient.get<ApiEnvelope<TelegramStatusData>>('/telegram/status');
    return res.data.data;
  },

  /**
   * Xem trước báo cáo doanh thu & đơn hàng (JSON + HTML định dạng Telegram)
   */
  async previewReport(date?: string): Promise<PreviewReportResponse> {
    const params = date ? { date } : {};
    const res = await apiClient.get<ApiEnvelope<PreviewReportResponse>>('/telegram/preview-report', { params });
    return res.data.data;
  },

  /**
   * Gửi báo cáo doanh thu lên Telegram ngay lập tức
   */
  async sendReport(targetDate?: string, chatId?: string): Promise<{ messageId?: number; reportData: any }> {
    const res = await apiClient.post<ApiEnvelope<{ messageId?: number; reportData: any }>>('/telegram/send-report', {
      targetDate,
      chatId,
    });
    return res.data.data;
  },

  /**
   * Bắn thử nghiệm tin nhắn cảnh báo sự cố khẩn cấp
   */
  async testAlert(alertType?: string, errorMessage?: string): Promise<{ messageId?: number; details: any }> {
    const res = await apiClient.post<ApiEnvelope<{ messageId?: number; details: any }>>('/telegram/test-alert', {
      alertType,
      errorMessage,
    });
    return res.data.data;
  },
};

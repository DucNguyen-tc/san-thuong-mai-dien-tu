import { telegramUtil } from '../utils/telegram.util';

export interface CriticalAlertPayload {
  title: string;
  eventType: string;
  orderId?: string;
  customerId?: string;
  reason: string;
  actionTaken?: string;
  extraDetails?: Record<string, any>;
}

export class TelegramAlertService {
  private static instance: TelegramAlertService;

  public static getInstance(): TelegramAlertService {
    if (!TelegramAlertService.instance) {
      TelegramAlertService.instance = new TelegramAlertService();
    }
    return TelegramAlertService.instance;
  }

  /**
   * Bắn cảnh báo sự cố nghiêm trọng (Critical Incident) tới Quản trị viên
   * Phục vụ giám sát hệ thống phân tán và bảo vệ đồ án trước Hội đồng
   */
  public async sendCriticalAlert(
    payload: CriticalAlertPayload,
    targetChatId?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Đã tắt hoàn toàn tính năng gửi cảnh báo sự cố về Telegram theo yêu cầu
    return { success: true };
  }

  /**
   * Thông báo khi phát sinh đơn hàng giá trị cao (VIP Order)
   */
  public async sendVipOrderAlert(order: { id: string; total_amount: any; customer_id: string; payment_method: string }): Promise<void> {
    // Đã tắt cảnh báo VIP về Telegram
    return;
  }
}

export const telegramAlertService = TelegramAlertService.getInstance();

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
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestampStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

    const escape = (text?: string) => (text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'N/A');

    let extraHtml = '';
    if (payload.extraDetails && Object.keys(payload.extraDetails).length > 0) {
      extraHtml = '\n🔍 <b>THÔNG SỐ BỔ SUNG:</b>\n' +
        Object.entries(payload.extraDetails)
          .map(([k, v]) => `• ${escape(k)}: <code>${escape(String(v))}</code>`)
          .join('\n');
    }

    const html = `
🚨 <b>[SỰ CỐ KHẨN CẤP / ALERTING SYSTEM]</b>
━━━━━━━━━━━━━━━━━━━━━━
💥 <b>Sự kiện:</b> <code>${escape(payload.eventType)}</code>
⚠️ <b>Tiêu đề:</b> <b>${escape(payload.title)}</b>

${payload.orderId ? `📦 <b>Mã đơn hàng:</b> <code>${escape(payload.orderId)}</code>\n` : ''}${payload.customerId ? `👤 <b>Mã khách hàng:</b> <code>${escape(payload.customerId)}</code>\n` : ''}⏱ <b>Thời gian:</b> ${timestampStr}
📝 <b>Nguyên nhân:</b>
<pre>${escape(payload.reason)}</pre>
${payload.actionTaken ? `🛠 <b>Hành động tự động (Compensation):</b>\n<i>${escape(payload.actionTaken)}</i>\n` : ''}${extraHtml}
━━━━━━━━━━━━━━━━━━━━━━
⚡ <i>Hệ thống tự động kích hoạt bởi Microservices Watchdog</i>
`.trim();

    return telegramUtil.sendMessage(html, targetChatId);
  }

  /**
   * Thông báo khi phát sinh đơn hàng giá trị cao (VIP Order)
   */
  public async sendVipOrderAlert(order: { id: string; total_amount: any; customer_id: string; payment_method: string }): Promise<void> {
    const amount = Number(order.total_amount);
    if (amount < 5000000) return; // Chỉ cảnh báo đơn từ 5 triệu trở lên

    const formattedAmount = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);

    const html = `
🎉 <b>[ĐƠN HÀNG GIÁ TRỊ CAO / VIP ORDER]</b>
━━━━━━━━━━━━━━━━━━━━━━
💎 <b>Giá trị đơn:</b> <b>${formattedAmount}</b>
📦 <b>Mã đơn hàng:</b> <code>${order.id}</code>
💳 <b>Phương thức:</b> ${order.payment_method}
👤 <b>Khách hàng:</b> <code>${order.customer_id}</code>
━━━━━━━━━━━━━━━━━━━━━━
⚡ <i>Kiểm tra kho và ưu tiên điều phối đóng gói</i>
`.trim();

    await telegramUtil.sendMessage(html);
  }
}

export const telegramAlertService = TelegramAlertService.getInstance();

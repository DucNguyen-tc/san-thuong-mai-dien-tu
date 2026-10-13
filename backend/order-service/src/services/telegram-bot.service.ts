import { telegramUtil, TelegramUpdate } from '../utils/telegram.util';
import { reportService } from './report.service';
import { telegramAlertService } from './telegram-alert.service';
import { prisma } from '../config/prisma';

export class TelegramBotService {
  private static instance: TelegramBotService;
  private isRunning: boolean = false;
  private shouldStop: boolean = false;
  private lastUpdateId: number = 0;

  public static getInstance(): TelegramBotService {
    if (!TelegramBotService.instance) {
      TelegramBotService.instance = new TelegramBotService();
    }
    return TelegramBotService.instance;
  }

  /**
   * Khởi động tiến trình Long-polling lắng nghe tin nhắn tương tác từ Admin
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;

    if (!telegramUtil.isConfigured()) {
      console.log('[TelegramBotService] Bot chưa được cấu hình token. Bỏ qua khởi động long-polling.');
      return;
    }

    const botInfo = await telegramUtil.getMe();
    if (!botInfo) {
      console.warn('[TelegramBotService] Không thể kết nối với Telegram Bot API. Vui lòng kiểm tra lại TELEGRAM_BOT_TOKEN.');
      return;
    }

    console.log(`[TelegramBotService] 🚀 Bot @${botInfo.username || botInfo.first_name} đã sẵn sàng nhận lệnh tương tác 2 chiều!`);

    // Tự động đăng ký menu lệnh trên app Telegram
    await telegramUtil.setMyCommands([
      { command: 'start', description: 'Khởi động & xem danh sách lệnh' },
      { command: 'report', description: 'Xem báo cáo doanh thu & đơn hàng tức thì' },
      { command: 'order', description: 'Tra cứu trạng thái đơn: /order <mã_đơn>' },
      { command: 'health', description: 'Kiểm tra sức khỏe hệ thống & Database' },
      { command: 'test_alert', description: 'Bắn thử tin nhắn cảnh báo sự cố' },
    ]);

    this.isRunning = true;
    this.shouldStop = false;
    this.pollLoop();
  }

  /**
   * Dừng an toàn tiến trình bot
   */
  public stop(): void {
    this.shouldStop = true;
    this.isRunning = false;
    console.log('[TelegramBotService] Đã gửi tín hiệu dừng Long-polling.');
  }

  public getStatus(): { isRunning: boolean; isConfigured: boolean; defaultChatId: string } {
    return {
      isRunning: this.isRunning,
      isConfigured: telegramUtil.isConfigured(),
      defaultChatId: telegramUtil.getDefaultChatId(),
    };
  }

  /**
   * Vòng lặp Long Polling xử lý tin nhắn
   */
  private async pollLoop(): Promise<void> {
    while (!this.shouldStop) {
      try {
        const updates: TelegramUpdate[] = await telegramUtil.getUpdates(this.lastUpdateId + 1, 20);

        for (const update of updates) {
          this.lastUpdateId = update.update_id;
          if (update.message && update.message.text) {
            await this.handleIncomingMessage(update.message);
          }
        }
      } catch (error: any) {
        console.error('[TelegramBotService] Lỗi trong vòng lặp polling:', error.message);
        // Chờ 5 giây trước khi thử lại để tránh spam khi rớt mạng
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    this.isRunning = false;
  }

  /**
   * Phân loại và xử lý các lệnh từ người dùng
   */
  private async handleIncomingMessage(message: NonNullable<TelegramUpdate['message']>): Promise<void> {
    const chatId = message.chat.id;
    const rawText = (message.text || '').trim();
    const senderName = message.from?.first_name || 'Admin';

    // 1. Kiểm tra xác thực Whitelist Admin
    if (!telegramUtil.isAuthorized(chatId)) {
      console.warn(`[TelegramBotService] ⚠️ PHÁT HIỆN TÀI KHOẢN MỚI TRUY CẬP -> Tên: "${senderName}", Chat ID: "${chatId}"`);
      const unauthorizedMsg = `
⛔ <b>TRUY CẬP BỊ TỪ CHỐI (UNAUTHORIZED)</b>
Xin chào <b>${senderName}</b>, bạn chưa được cấp quyền quản trị trên hệ thống này!

🆔 <b>Chat ID của bạn:</b> <code>${chatId}</code>
💡 <i>Hướng dẫn: Hãy sao chép Chat ID trên và cấu hình vào biến <code>TELEGRAM_CHAT_ID</code> trong file <code>.env</code> của hệ thống để được kích hoạt quyền truy cập.</i>
`.trim();
      await telegramUtil.sendMessage(unauthorizedMsg, String(chatId));
      return;
    }

    // 2. Phân tích cú pháp lệnh (Command Parser)
    const [command, ...args] = rawText.split(/\s+/);
    const cmd = command.toLowerCase();

    try {
      switch (cmd) {
        case '/start':
        case '/help':
          await this.cmdHelp(chatId, senderName);
          break;

        case '/report':
          await this.cmdReport(chatId, args);
          break;

        case '/order':
          await this.cmdOrder(chatId, args);
          break;

        case '/health':
          await this.cmdHealth(chatId);
          break;

        case '/test_alert':
          await this.cmdTestAlert(chatId);
          break;

        default:
          if (cmd.startsWith('/')) {
            await telegramUtil.sendMessage(
              `❓ <b>Lệnh không xác định:</b> <code>${cmd}</code>\nNhập <code>/help</code> để xem danh sách lệnh được hỗ trợ.`,
              String(chatId)
            );
          }
          break;
      }
    } catch (error: any) {
      console.error(`[TelegramBotService] Lỗi khi xử lý lệnh ${cmd}:`, error.message);
      await telegramUtil.sendMessage(
        `❌ <b>Đã có lỗi xảy ra khi thực thi lệnh:</b>\n<code>${this.escapeHtml(error.message)}</code>`,
        String(chatId)
      );
    }
  }

  private escapeHtml(text: string): string {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // --- HANDLERS CHO CÁC LỆNH ---

  private async cmdHelp(chatId: number, senderName: string): Promise<void> {
    const text = `
👋 <b>Xin chào, ${senderName}!</b>
Chào mừng bạn đến với <b>Trung Tâm Điều Hành & Giám Sát TMĐT</b>.

Danh sách các lệnh hỗ trợ:
━━━━━━━━━━━━━━━━━━━━━━
📊 <code>/report</code> - Báo cáo kinh doanh hôm nay
📊 <code>/report yesterday</code> - Báo cáo ngày hôm qua
📊 <code>/report &lt;YYYY-MM-DD&gt;</code> - Báo cáo 1 ngày cụ thể (VD: <code>/report 2026-10-10</code>)
📊 <code>/report &lt;N&gt;days</code> - Báo cáo tổng hợp N ngày (VD: <code>/report 3days</code>, <code>/report 7days</code>)
📊 <code>/report &lt;từ_ngày&gt; &lt;đến_ngày&gt;</code> - Tổng hợp khoảng ngày (VD: <code>/report 2026-10-01 2026-10-12</code>)
📦 <code>/order &lt;mã_đơn&gt;</code> - Tra cứu trạng thái & chi tiết đơn hàng
🩺 <code>/health</code> - Kiểm tra sức khỏe Server & Database PostgreSQL
🚨 <code>/test_alert</code> - Thử nghiệm bắn tin cảnh báo sự cố khẩn cấp
❓ <code>/help</code> - Xem lại bảng hướng dẫn này
━━━━━━━━━━━━━━━━━━━━━━
⚡ <i>Hệ thống được lập lịch tự động báo cáo mỗi ngày lúc 23:00.</i>
`.trim();
    await telegramUtil.sendMessage(text, String(chatId));
  }

  private isValidDateStr(str: string): boolean {
    return /^\d{4}-\d{1,2}-\d{1,2}$/.test(str) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str);
  }

  private parseDateStr(str: string): Date {
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const [d, m, y] = str.split('/').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(str);
  }

  private async cmdReport(chatId: number, args: string[]): Promise<void> {
    let startDate: Date = new Date();
    let endDate: Date | undefined = undefined;

    if (args.length > 0) {
      const firstArg = args[0].toLowerCase().trim();

      // Case 1: yesterday / homqua
      if (firstArg === 'yesterday' || firstArg === 'homqua') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        endDate = new Date(startDate);
      }
      // Case 2: 2days, 3days, 7days, 30d, 3ngay
      else if (/^(\d+)\s*(days?|d|ngay)$/i.test(firstArg)) {
        const match = firstArg.match(/^(\d+)/);
        const days = match ? parseInt(match[1], 10) : 1;
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - (days - 1));
      }
      // Case 3: 2026-10-10 hoặc 10/10/2026 (ngày cụ thể hoặc khoảng ngày)
      else if (this.isValidDateStr(firstArg)) {
        startDate = this.parseDateStr(firstArg);
        if (args.length > 1 && this.isValidDateStr(args[1].trim())) {
          endDate = this.parseDateStr(args[1].trim());
        } else {
          endDate = new Date(startDate);
        }
      }
    }

    await telegramUtil.sendMessage('⏳ <i>Đang trích xuất và tổng hợp dữ liệu từ Database...</i>', String(chatId));

    const data = await reportService.getDailyReportData(startDate, endDate);
    const html = reportService.formatReportHtml(data);
    await telegramUtil.sendMessage(html, String(chatId));
  }

  private async cmdOrder(chatId: number, args: string[]): Promise<void> {
    if (args.length === 0) {
      await telegramUtil.sendMessage(
        '⚠️ <b>Cú pháp:</b> <code>/order &lt;Mã_Đơn_Hàng_UUID&gt;</code>\nVí dụ: <code>/order c8a91395-926f-4cfa-9311-6677f24ddbf2</code>',
        String(chatId)
      );
      return;
    }

    const orderId = args[0].trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      await telegramUtil.sendMessage(
        `⚠️ <b>Mã đơn hàng không hợp lệ!</b>\nMã đơn phải có định dạng UUID chuẩn (ví dụ: <code>c8a91395-926f-4cfa-9311-6677f24ddbf2</code>).\nBạn vừa nhập: <code>${this.escapeHtml(orderId)}</code>`,
        String(chatId)
      );
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      await telegramUtil.sendMessage(
        `❌ Không tìm thấy đơn hàng với mã: <code>${this.escapeHtml(orderId)}</code>`,
        String(chatId)
      );
      return;
    }

    const formatCurrency = (n: any) => reportService.formatCurrency(Number(n));
    const pad = (n: number) => String(n).padStart(2, '0');
    const createdDate = new Date(order.created_at);
    const createdStr = `${pad(createdDate.getHours())}:${pad(createdDate.getMinutes())} ${pad(createdDate.getDate())}/${pad(createdDate.getMonth() + 1)}/${createdDate.getFullYear()}`;

    const itemsText = order.items
      .map((item, idx) => `  ${idx + 1}. <b>${item.product_name_snapshot}</b> x${item.quantity}\n     ↳ Đơn giá: ${formatCurrency(item.unit_price_snapshot)} (Tổng: ${formatCurrency(item.line_total)})`)
      .join('\n');

    const statusBadge =
      order.status === 'COMPLETED' ? '✅ COMPLETED (Đã giao hàng)' :
      order.status === 'CONFIRMED' ? '🔵 CONFIRMED (Đã xác nhận)' :
      order.status === 'SHIPPING' ? '🚚 SHIPPING (Đang vận chuyển)' :
      order.status === 'CANCELLED' ? '❌ CANCELLED (Đã hủy)' : '⏳ PENDING_PAYMENT (Chờ thanh toán)';

    const html = `
📦 <b>CHI TIẾT ĐƠN HÀNG TRÊN HỆ THỐNG</b>
━━━━━━━━━━━━━━━━━━━━━━
• <b>Mã đơn:</b> <code>${order.id}</code>
• <b>Trạng thái:</b> <b>${statusBadge}</b>
• <b>Khách hàng ID:</b> <code>${order.customer_id}</code>
• <b>Phương thức:</b> 💳 <b>${order.payment_method}</b>
• <b>Ngày tạo:</b> ${createdStr}
• <b>Địa chỉ:</b> <i>${order.shipping_address}</i>

💰 <b>TÀI CHÍNH:</b>
• Tiền hàng: ${formatCurrency(order.subtotal)}
• Phí ship: ${formatCurrency(order.shipping_fee)}
• Giảm giá: ${formatCurrency(order.discount_amount)}
• 👉 <b>TỔNG THANH TOÁN:</b> <b>${formatCurrency(order.total_amount)}</b>

📋 <b>DANH SÁCH MÓN HÀNG (${order.items.length}):</b>
${itemsText}
━━━━━━━━━━━━━━━━━━━━━━
`.trim();

    await telegramUtil.sendMessage(html, String(chatId));
  }

  private async cmdHealth(chatId: number): Promise<void> {
    const startTime = Date.now();
    let dbStatus = '🟢 HOẠT ĐỘNG TỐT';
    let dbLatency = 0;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - startTime;
    } catch (err: any) {
      dbStatus = `🔴 MẤT KẾT NỐI (${err.message})`;
    }

    const mem = process.memoryUsage();
    const toMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const seconds = uptimeSec % 60;
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    const html = `
🩺 <b>GIÁM SÁT HẠ TẦNG (MICROSERVICES HEALTH)</b>
━━━━━━━━━━━━━━━━━━━━━━
⚙️ <b>Dịch vụ:</b> <code>order-service</code>
📊 <b>Trạng thái Database:</b> ${dbStatus}
⚡ <b>Độ trễ DB:</b> <code>${dbLatency}ms</code>
⏱ <b>Thời gian hoạt động (Uptime):</b> <b>${uptimeStr}</b>
💾 <b>RAM sử dụng (RSS):</b> <code>${toMB(mem.rss)} MB</code>
🧠 <b>Heap Memory:</b> <code>${toMB(mem.heapUsed)} / ${toMB(mem.heapTotal)} MB</code>
🌐 <b>Node Version:</b> <code>${process.version}</code>
━━━━━━━━━━━━━━━━━━━━━━
✅ <i>Tất cả luồng giao dịch sẵn sàng tiếp nhận!</i>
`.trim();

    await telegramUtil.sendMessage(html, String(chatId));
  }

  private async cmdTestAlert(chatId: number): Promise<void> {
    await telegramAlertService.sendCriticalAlert(
      {
        title: 'Thử nghiệm hệ thống cảnh báo sự cố phân tán',
        eventType: 'SAGA_COMPENSATION_TRIGGERED',
        orderId: 'DEMO-ORDER-UUID-999',
        reason: 'Catalog Service phản hồi timeout khi thực hiện bù trừ tồn kho.',
        actionTaken: 'Hệ thống đã kích hoạt cơ chế đền bù tự động và đánh dấu đơn hàng cần đối soát.',
        extraDetails: {
          'Retry Count': 3,
          'Triggered By': `Admin (/test_alert)`,
        },
      },
      String(chatId)
    );
  }
}

export const telegramBotService = TelegramBotService.getInstance();

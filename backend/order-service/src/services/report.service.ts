import { prisma } from '../config/prisma';
import { telegramUtil } from '../utils/telegram.util';
import { OrderStatus, PaymentMethod } from '@prisma/client';

export interface TopProductSummary {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface PaymentMethodSummary {
  method: PaymentMethod;
  count: number;
  totalAmount: number;
}

export interface DailyReportData {
  reportDateStr: string;
  generatedAtStr: string;
  totalOrders: number;
  completedOrders: number;
  confirmedOrders: number;
  shippingOrders: number;
  pendingPaymentOrders: number;
  cancelledOrders: number;
  successRate: number; // Tỷ lệ % đơn thành công hoặc đang giao
  completedRevenue: number;
  grossRevenue: number; // Doanh thu tất cả đơn không bị hủy
  topProducts: TopProductSummary[];
  paymentBreakdown: PaymentMethodSummary[];
}

export class ReportService {
  private static instance: ReportService;

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  /**
   * Tính toán khoảng thời gian từ 00:00:00.000 đến 23:59:59.999 của ngày hoặc khoảng ngày
   */
  public getDateRange(
    startDate: Date = new Date(),
    endDate?: Date
  ): { startOfDay: Date; endOfDay: Date; dateStr: string; isRange: boolean; daysCount: number } {
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endTarget = endDate ? new Date(endDate) : new Date(startDate);
    const endOfDay = new Date(endTarget);
    endOfDay.setHours(23, 59, 59, 999);

    const pad = (n: number) => String(n).padStart(2, '0');
    const startStr = `${pad(startOfDay.getDate())}/${pad(startOfDay.getMonth() + 1)}/${startOfDay.getFullYear()}`;
    const endStr = `${pad(endOfDay.getDate())}/${pad(endOfDay.getMonth() + 1)}/${endOfDay.getFullYear()}`;

    const isRange = startStr !== endStr;
    const daysCount = Math.max(1, Math.round((endOfDay.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24)));
    const dateStr = isRange ? `${startStr} - ${endStr} (${daysCount} ngày)` : startStr;

    return { startOfDay, endOfDay, dateStr, isRange, daysCount };
  }

  /**
   * Truy vấn và tổng hợp các số liệu kinh doanh trọng yếu từ Database theo ngày hoặc khoảng ngày
   */
  public async getDailyReportData(startDate: Date = new Date(), endDate?: Date): Promise<DailyReportData> {
    const { startOfDay, endOfDay, dateStr } = this.getDateRange(startDate, endDate);

    // 1. Tổng số đơn hàng trong ngày
    const totalOrders = await prisma.order.count({
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // 2. Thống kê theo trạng thái đơn hàng
    const ordersGroupedByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _count: {
        _all: true,
      },
      _sum: {
        total_amount: true,
      },
    });

    let completedOrders = 0;
    let confirmedOrders = 0;
    let shippingOrders = 0;
    let pendingPaymentOrders = 0;
    let cancelledOrders = 0;
    let completedRevenue = 0;
    let grossRevenue = 0;

    for (const group of ordersGroupedByStatus) {
      const count = group._count._all;
      const amount = Number(group._sum.total_amount || 0);

      switch (group.status) {
        case OrderStatus.COMPLETED:
          completedOrders = count;
          completedRevenue += amount;
          grossRevenue += amount;
          break;
        case OrderStatus.CONFIRMED:
          confirmedOrders = count;
          grossRevenue += amount;
          break;
        case OrderStatus.SHIPPING:
          shippingOrders = count;
          grossRevenue += amount;
          break;
        case OrderStatus.PENDING_PAYMENT:
          pendingPaymentOrders = count;
          break;
        case OrderStatus.CANCELLED:
          cancelledOrders = count;
          break;
      }
    }

    // Tỷ lệ hoàn thành / tích cực
    const activeSuccessful = completedOrders + confirmedOrders + shippingOrders;
    const successRate = totalOrders > 0 ? Number(((activeSuccessful / totalOrders) * 100).toFixed(1)) : 0;

    // 3. Phân bổ theo Phương thức thanh toán
    const ordersByPayment = await prisma.order.groupBy({
      by: ['payment_method'],
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: OrderStatus.CANCELLED,
        },
      },
      _count: {
        _all: true,
      },
      _sum: {
        total_amount: true,
      },
    });

    const paymentBreakdown: PaymentMethodSummary[] = ordersByPayment.map(item => ({
      method: item.payment_method,
      count: item._count._all,
      totalAmount: Number(item._sum.total_amount || 0),
    }));

    // 4. Top sản phẩm bán chạy nhất trong ngày
    const topProductsData = await prisma.orderItem.groupBy({
      by: ['product_id', 'product_name_snapshot'],
      where: {
        order: {
          created_at: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            not: OrderStatus.CANCELLED,
          },
        },
      },
      _sum: {
        quantity: true,
        line_total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const topProducts: TopProductSummary[] = topProductsData.map(item => ({
      productId: item.product_id,
      name: item.product_name_snapshot,
      quantity: item._sum.quantity || 0,
      revenue: Number(item._sum.line_total || 0),
    }));

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const generatedAtStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

    return {
      reportDateStr: dateStr,
      generatedAtStr,
      totalOrders,
      completedOrders,
      confirmedOrders,
      shippingOrders,
      pendingPaymentOrders,
      cancelledOrders,
      successRate,
      completedRevenue,
      grossRevenue,
      topProducts,
      paymentBreakdown,
    };
  }

  /**
   * Định dạng số tiền sang định dạng VND đẹp mắt (ví dụ: 1.500.000 ₫)
   */
  public formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Tạo bản tin HTML chuyên nghiệp gửi tới Telegram
   */
  public formatReportHtml(data: DailyReportData): string {
    const formattedCompletedRev = this.formatCurrency(data.completedRevenue);
    const formattedGrossRev = this.formatCurrency(data.grossRevenue);

    // Xử lý danh sách Top sản phẩm
    let topProductsHtml = '';
    if (data.topProducts.length === 0) {
      topProductsHtml = '<i>Chưa có dữ liệu bán hàng trong ngày</i>';
    } else {
      topProductsHtml = data.topProducts
        .map((p, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🔹';
          const rev = this.formatCurrency(p.revenue);
          return `${medal} <b>${this.escapeHtml(p.name)}</b>\n    ↳ Đã bán: <b>${p.quantity}</b> cái • Thu về: <code>${rev}</code>`;
        })
        .join('\n');
    }

    // Xử lý phân bổ phương thức thanh toán
    let paymentHtml = '';
    if (data.paymentBreakdown.length === 0) {
      paymentHtml = '<i>Chưa có giao dịch</i>';
    } else {
      paymentHtml = data.paymentBreakdown
        .map(pm => {
          const icon = pm.method === PaymentMethod.VNPAY ? '💳 VNPAY' : pm.method === PaymentMethod.MOMO ? '👛 MOMO' : '💵 Tiền mặt (COD)';
          return `• ${icon}: <b>${pm.count}</b> đơn (<code>${this.formatCurrency(pm.totalAmount)}</code>)`;
        })
        .join('\n');
    }

    const isRange = data.reportDateStr.includes('-');
    const titleHeader = isRange
      ? `📊 <b>BÁO CÁO KINH DOANH TỔNG HỢP</b>\n<i>Khoảng thời gian: ${data.reportDateStr}</i>`
      : `📊 <b>BÁO CÁO KINH DOANH NGÀY ${data.reportDateStr}</b>\n<i>Hệ Thống Sàn Thương Mại Điện Tử Microservices</i>`;

    return `
${titleHeader}
━━━━━━━━━━━━━━━━━━━━━━

💰 <b>TÀI CHÍNH & DOANH THU:</b>
• Doanh thu thực nhận: <b>${formattedCompletedRev}</b>
• Tổng giá trị đơn đang chạy: <code>${formattedGrossRev}</code>

📦 <b>TÌNH HÌNH ĐƠN HÀNG:</b>
• Tổng đơn phát sinh: <b>${data.totalOrders}</b> đơn
• ✅ Đã giao hoàn tất: <b>${data.completedOrders}</b> đơn
• 🚚 Đang vận chuyển: <b>${data.shippingOrders}</b> đơn
• ⏳ Chờ xử lý / xác nhận: <b>${data.confirmedOrders + data.pendingPaymentOrders}</b> đơn
• ❌ Đơn đã hủy: <b>${data.cancelledOrders}</b> đơn
• 🎯 Tỷ lệ đơn tích cực: <b>${data.successRate}%</b>

💳 <b>THANH TOÁN HỢP LỆ:</b>
${paymentHtml}

🏆 <b>TOP SẢN PHẨM BÁN CHẠY:</b>
${topProductsHtml}

━━━━━━━━━━━━━━━━━━━━━━
⏱ <i>Báo cáo tạo lúc: ${data.generatedAtStr}</i>
🤖 <i>Trợ lý vận hành tự động (Order Service Monitoring)</i>
`.trim();
  }

  /**
   * Gửi báo cáo định kỳ tới Telegram (theo ngày hoặc khoảng ngày)
   */
  public async sendDailyReport(
    startDate: Date = new Date(),
    endDateOrChatId?: Date | string,
    targetChatId?: string
  ): Promise<{ success: boolean; data: DailyReportData; messageId?: number; error?: string }> {
    try {
      let endDate: Date | undefined;
      let chatId: string | undefined;

      if (typeof endDateOrChatId === 'string') {
        chatId = endDateOrChatId;
      } else if (endDateOrChatId instanceof Date) {
        endDate = endDateOrChatId;
        chatId = targetChatId;
      } else {
        chatId = targetChatId;
      }

      const data = await this.getDailyReportData(startDate, endDate);
      const htmlContent = this.formatReportHtml(data);
      const sendResult = await telegramUtil.sendMessage(htmlContent, chatId);

      if (sendResult.success) {
        console.log(`[ReportService] Báo cáo ngày ${data.reportDateStr} đã được gửi thành công đến Telegram (Message ID: ${sendResult.messageId})`);
        return { success: true, data, messageId: sendResult.messageId };
      } else {
        console.error(`[ReportService] Không thể gửi báo cáo lên Telegram:`, sendResult.error);
        return { success: false, data, error: sendResult.error };
      }
    } catch (error: any) {
      console.error('[ReportService] Lỗi khi tạo/gửi báo cáo:', error.message);
      throw error;
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

export const reportService = ReportService.getInstance();

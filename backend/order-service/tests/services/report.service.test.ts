import { reportService } from '../../src/services/report.service';
import { prismaMock } from '../setup/prismaMock';
import { telegramUtil } from '../../src/utils/telegram.util';
import { OrderStatus, PaymentMethod } from '@prisma/client';

describe('ReportService - Daily Business Intelligence Report', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDateRange', () => {
    it('should correctly calculate startOfDay and endOfDay for given date', () => {
      const fixedDate = new Date('2026-10-11T15:30:00.000Z');
      const { startOfDay, endOfDay, dateStr } = reportService.getDateRange(fixedDate);

      expect(startOfDay.getHours()).toBe(0);
      expect(startOfDay.getMinutes()).toBe(0);
      expect(startOfDay.getSeconds()).toBe(0);
      expect(startOfDay.getMilliseconds()).toBe(0);

      expect(endOfDay.getHours()).toBe(23);
      expect(endOfDay.getMinutes()).toBe(59);
      expect(endOfDay.getSeconds()).toBe(59);
      expect(endOfDay.getMilliseconds()).toBe(999);

      expect(dateStr).toContain('11/10/2026');
    });
  });

  describe('getDailyReportData', () => {
    it('should query and compute accurate order statistics, revenue, and top products', async () => {
      // 1. Mock Total Orders count
      prismaMock.order.count.mockResolvedValue(10);

      // 2. Mock Status groupBy
      (prismaMock.order.groupBy as jest.Mock).mockImplementation((args: any) => {
        if (args.by.includes('status')) {
          return Promise.resolve([
            { status: OrderStatus.COMPLETED, _count: { _all: 6 }, _sum: { total_amount: 12000000 } },
            { status: OrderStatus.CONFIRMED, _count: { _all: 2 }, _sum: { total_amount: 4000000 } },
            { status: OrderStatus.CANCELLED, _count: { _all: 2 }, _sum: { total_amount: 3000000 } },
          ]);
        }
        if (args.by.includes('payment_method')) {
          return Promise.resolve([
            { payment_method: PaymentMethod.VNPAY, _count: { _all: 5 }, _sum: { total_amount: 10000000 } },
            { payment_method: PaymentMethod.CASH, _count: { _all: 3 }, _sum: { total_amount: 6000000 } },
          ]);
        }
        return Promise.resolve([]);
      });

      // 3. Mock Top Products
      (prismaMock.orderItem.groupBy as jest.Mock).mockResolvedValue([
        {
          product_id: 'prod-001',
          product_name_snapshot: 'Laptop Gaming ASUS ROG',
          _sum: { quantity: 4, line_total: 80000000 },
        },
        {
          product_id: 'prod-002',
          product_name_snapshot: 'Bàn phím cơ DareU EK87',
          _sum: { quantity: 7, line_total: 4200000 },
        },
      ]);

      const data = await reportService.getDailyReportData(new Date('2026-10-11T12:00:00Z'));

      expect(data.totalOrders).toBe(10);
      expect(data.completedOrders).toBe(6);
      expect(data.confirmedOrders).toBe(2);
      expect(data.cancelledOrders).toBe(2);
      expect(data.completedRevenue).toBe(12000000);
      expect(data.grossRevenue).toBe(16000000); // 12tr + 4tr
      expect(data.successRate).toBe(80); // (6+2)/10 * 100
      expect(data.topProducts).toHaveLength(2);
      expect(data.topProducts[0].name).toBe('Laptop Gaming ASUS ROG');
      expect(data.topProducts[0].quantity).toBe(4);
    });
  });

  describe('formatReportHtml', () => {
    it('should format data into structured HTML with Vietnamese currency and emojis', () => {
      const mockData = {
        reportDateStr: '11/10/2026',
        generatedAtStr: '23:00:00 11/10/2026',
        totalOrders: 15,
        completedOrders: 10,
        confirmedOrders: 2,
        shippingOrders: 1,
        pendingPaymentOrders: 1,
        cancelledOrders: 1,
        successRate: 86.7,
        completedRevenue: 25000000,
        grossRevenue: 30000000,
        topProducts: [
          { productId: 'p1', name: 'Chuột không dây Logitech G Pro X', quantity: 5, revenue: 12500000 },
        ],
        paymentBreakdown: [
          { method: PaymentMethod.VNPAY, count: 8, totalAmount: 20000000 },
        ],
      };

      const html = reportService.formatReportHtml(mockData);

      expect(html).toContain('BÁO CÁO KINH DOANH NGÀY 11/10/2026');
      expect(html).toContain('Tổng đơn phát sinh: <b>15</b> đơn');
      expect(html).toContain('Tỷ lệ đơn tích cực: <b>86.7%</b>');
      expect(html).toContain('Chuột không dây Logitech G Pro X');
      expect(html).toContain('VNPAY');
    });
  });

  describe('sendDailyReport', () => {
    it('should call telegramUtil.sendMessage with formatted content', async () => {
      prismaMock.order.count.mockResolvedValue(0);
      (prismaMock.order.groupBy as jest.Mock).mockResolvedValue([]);
      (prismaMock.orderItem.groupBy as jest.Mock).mockResolvedValue([]);

      const sendSpy = jest.spyOn(telegramUtil, 'sendMessage').mockResolvedValue({
        success: true,
        messageId: 101,
      });

      const result = await reportService.sendDailyReport(new Date(), '999888');

      expect(sendSpy).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.messageId).toBe(101);
    });
  });
});

import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export class StatsController {
  private parseDateParam(str?: string): Date | null {
    if (!str) return null;
    const s = String(str).trim();
    const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      return new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
    }
    const ymdMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (ymdMatch) {
      return new Date(Number(ymdMatch[1]), Number(ymdMatch[2]) - 1, Number(ymdMatch[3]));
    }
    const parsed = new Date(s);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  public async getDashboardStats(req: Request, res: Response) {
    try {
      const { period, startDate: qStartDate, endDate: qEndDate, days: qDays } = req.query;

      let startOfDay: Date;
      let endOfDay: Date;

      const now = new Date();

      if (period === 'today') {
        startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
      } else if (period === 'yesterday') {
        startOfDay = new Date(now);
        startOfDay.setDate(startOfDay.getDate() - 1);
        startOfDay.setHours(0, 0, 0, 0);
        endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);
      } else if (period === '30days') {
        endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        startOfDay = new Date(now);
        startOfDay.setDate(startOfDay.getDate() - 29);
        startOfDay.setHours(0, 0, 0, 0);
      } else if (period === 'this_month') {
        startOfDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
      } else if (qStartDate) {
        const parsedStart = this.parseDateParam(String(qStartDate));
        startOfDay = parsedStart || new Date(now.setDate(now.getDate() - 6));
        startOfDay.setHours(0, 0, 0, 0);

        if (qEndDate) {
          const parsedEnd = this.parseDateParam(String(qEndDate));
          endOfDay = parsedEnd || new Date(startOfDay);
        } else {
          endOfDay = new Date(startOfDay);
        }
        endOfDay.setHours(23, 59, 59, 999);
      } else if (qDays && !isNaN(Number(qDays))) {
        const dCount = Math.max(1, Number(qDays));
        endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        startOfDay = new Date(now);
        startOfDay.setDate(startOfDay.getDate() - (dCount - 1));
        startOfDay.setHours(0, 0, 0, 0);
      } else {
        // Mặc định: 7 ngày gần nhất
        endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        startOfDay = new Date(now);
        startOfDay.setDate(startOfDay.getDate() - 6);
        startOfDay.setHours(0, 0, 0, 0);
      }

      // Đảm bảo startOfDay <= endOfDay
      if (startOfDay > endOfDay) {
        const tmp = startOfDay;
        startOfDay = endOfDay;
        endOfDay = tmp;
        startOfDay.setHours(0, 0, 0, 0);
        endOfDay.setHours(23, 59, 59, 999);
      }

      // 1. Lấy tất cả đơn hàng trong khoảng thời gian đã chọn
      const orders = await prisma.order.findMany({
        where: {
          created_at: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          id: true,
          status: true,
          total_amount: true,
          payment_method: true,
          created_at: true,
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      // 2. Thống kê theo trạng thái và tính doanh thu
      const totalOrders = orders.length;
      let completedOrders = 0;
      let confirmedOrders = 0;
      let shippingOrders = 0;
      let pendingPaymentOrders = 0;
      let cancelledOrders = 0;
      let completedRevenue = 0;
      let grossRevenue = 0;

      for (const order of orders) {
        const amt = Number(order.total_amount || 0);
        switch (order.status) {
          case 'COMPLETED':
            completedOrders++;
            completedRevenue += amt;
            grossRevenue += amt;
            break;
          case 'CONFIRMED':
            confirmedOrders++;
            grossRevenue += amt;
            break;
          case 'SHIPPING':
            shippingOrders++;
            grossRevenue += amt;
            break;
          case 'PENDING_PAYMENT':
            pendingPaymentOrders++;
            break;
          case 'CANCELLED':
            cancelledOrders++;
            break;
        }
      }

      const activeOrders = completedOrders + confirmedOrders + shippingOrders;
      const successRate = totalOrders > 0 ? Number(((activeOrders / totalOrders) * 100).toFixed(1)) : 0;
      const averageOrderValue = activeOrders > 0 ? Math.round(grossRevenue / activeOrders) : 0;

      // 3. Cơ cấu phương thức thanh toán
      const paymentMap: Record<string, { count: number; totalAmount: number }> = {
        VNPAY: { count: 0, totalAmount: 0 },
        MOMO: { count: 0, totalAmount: 0 },
        CASH: { count: 0, totalAmount: 0 },
      };

      for (const order of orders) {
        if (order.status !== 'CANCELLED') {
          const m = order.payment_method || 'CASH';
          if (!paymentMap[m]) paymentMap[m] = { count: 0, totalAmount: 0 };
          paymentMap[m].count++;
          paymentMap[m].totalAmount += Number(order.total_amount || 0);
        }
      }

      const paymentBreakdown = Object.entries(paymentMap).map(([method, data]) => ({
        method,
        count: data.count,
        totalAmount: data.totalAmount,
        percentage: grossRevenue > 0 ? Number(((data.totalAmount / grossRevenue) * 100).toFixed(1)) : 0,
      }));

      // 4. Time-series dữ liệu chuỗi ngày (recentStats)
      const toLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const diffTime = Math.abs(endOfDay.getTime() - startOfDay.getTime());
      const diffDays = Math.min(90, Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))));

      const revenueByDate: Record<string, number> = {};
      const ordersByDate: Record<string, number> = {};

      for (let i = 0; i < diffDays; i++) {
        const d = new Date(startOfDay);
        d.setDate(d.getDate() + i);
        const dateStr = toLocalDateString(d);
        revenueByDate[dateStr] = 0;
        ordersByDate[dateStr] = 0;
      }

      orders.forEach((order) => {
        if (order.status !== 'CANCELLED') {
          const dateStr = toLocalDateString(order.created_at);
          if (revenueByDate[dateStr] !== undefined) {
            revenueByDate[dateStr] += Number(order.total_amount || 0);
            ordersByDate[dateStr] += 1;
          }
        }
      });

      const recentStats = Object.keys(revenueByDate)
        .sort()
        .map((date) => ({
          date,
          revenue: revenueByDate[date],
          orders: ordersByDate[date],
        }));

      // 5. Phân tích ngày đạt đỉnh doanh thu và ngày nhiều đơn nhất
      let peakRevenueDay = { date: '', revenue: 0, orders: 0 };
      let peakOrdersDay = { date: '', orders: 0, revenue: 0 };

      for (const stat of recentStats) {
        if (stat.revenue > peakRevenueDay.revenue) {
          peakRevenueDay = { date: stat.date, revenue: stat.revenue, orders: stat.orders };
        }
        if (stat.orders > peakOrdersDay.orders) {
          peakOrdersDay = { date: stat.date, orders: stat.orders, revenue: stat.revenue };
        }
      }

      // 6. Top sản phẩm bán chạy nhất TRONG KHOẢNG NGÀY ĐÃ CHỌN
      const topItems = await prisma.orderItem.findMany({
        where: {
          order: {
            created_at: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: {
              not: "CANCELLED",
            },
          },
        },
        select: {
          product_id: true,
          product_name_snapshot: true,
          product_image_snapshot: true,
          quantity: true,
          line_total: true,
        },
      });

      const productMap = new Map<string, { id: string; name: string; image?: string | null; soldCount: number; revenue: number }>();
      for (const item of topItems) {
        const existing = productMap.get(item.product_id);
        const qty = item.quantity;
        const rev = Number(item.line_total || 0);
        if (existing) {
          existing.soldCount += qty;
          existing.revenue += rev;
        } else {
          productMap.set(item.product_id, {
            id: item.product_id,
            name: item.product_name_snapshot,
            image: item.product_image_snapshot,
            soldCount: qty,
            revenue: rev,
          });
        }
      }

      const topSellingProducts = Array.from(productMap.values())
        .sort((a, b) => b.soldCount - a.soldCount || b.revenue - a.revenue)
        .slice(0, 10);

      const topRecommendedProducts: any[] = [];

      return res.status(200).json({
        success: true,
        message: "Lấy thống kê thành công",
        data: {
          dateRange: {
            startDate: toLocalDateString(startOfDay),
            endDate: toLocalDateString(endOfDay),
            daysCount: diffDays,
          },
          totalOrders,
          totalRevenue: Number(grossRevenue),
          completedRevenue: Number(completedRevenue),
          averageOrderValue,
          successRate,
          peakRevenueDay,
          peakOrdersDay,
          statusBreakdown: {
            completed: completedOrders,
            confirmed: confirmedOrders,
            shipping: shippingOrders,
            pendingPayment: pendingPaymentOrders,
            cancelled: cancelledOrders,
          },
          paymentBreakdown,
          recentStats,
          topSellingProducts,
          topRecommendedProducts,
        },
      });
    } catch (error: any) {
      console.error("Lỗi khi lấy thống kê:", error.message);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê đơn hàng",
      });
    }
  }
}

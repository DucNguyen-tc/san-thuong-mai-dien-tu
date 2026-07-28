import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export class StatsController {
  public async getDashboardStats(req: Request, res: Response) {
    try {
      // 1. Total Orders
      const totalOrders = await prisma.order.count();

      // 2. Total Revenue (sum of total_amount where status is COMPLETED or maybe all non-cancelled)
      const revenueResult = await prisma.order.aggregate({
        _sum: {
          total_amount: true,
        },
        where: {
          status: {
            not: 'CANCELLED',
          },
        },
      });
      const totalRevenue = revenueResult._sum.total_amount ? Number(revenueResult._sum.total_amount) : 0;

      // 3. Orders and Revenue over the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const recentOrders = await prisma.order.findMany({
        where: {
          created_at: {
            gte: sevenDaysAgo,
          },
          status: {
            not: 'CANCELLED',
          },
        },
        select: {
          total_amount: true,
          created_at: true,
        },
      });

      // Group by day
      const revenueByDate: Record<string, number> = {};
      const ordersByDate: Record<string, number> = {};

      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        revenueByDate[dateStr] = 0;
        ordersByDate[dateStr] = 0;
      }

      recentOrders.forEach(order => {
        const dateStr = order.created_at.toISOString().split('T')[0];
        if (revenueByDate[dateStr] !== undefined) {
          revenueByDate[dateStr] += Number(order.total_amount);
          ordersByDate[dateStr] += 1;
        }
      });

      const recentStats = Object.keys(revenueByDate).sort().map(date => ({
        date,
        revenue: revenueByDate[date],
        orders: ordersByDate[date],
      }));

      // 4. Top Selling Products
      const topProductsData = await prisma.orderItem.groupBy({
        by: ['product_id', 'product_name_snapshot'],
        _sum: {
          quantity: true,
          line_total: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      });

      let topSellingProducts = topProductsData.map(item => ({
        id: item.product_id,
        name: item.product_name_snapshot,
        soldCount: item._sum.quantity || 0,
        revenue: Number(item._sum.line_total || 0)
      }));

      // 5. Top Recommended Products (Person B handles the real data in recommendation-service)
      // Tạm thời trả về mảng rỗng do chưa có dữ liệu AI
      const topRecommendedProducts: any[] = [];

      return res.status(200).json({
        success: true,
        message: 'Lấy thống kê thành công',
        data: {
          totalOrders,
          totalRevenue: Number(totalRevenue),
          recentStats,
          topSellingProducts,
          topRecommendedProducts
        },
      });
    } catch (error: any) {
      console.error('Lỗi khi lấy thống kê:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê đơn hàng',
      });
    }
  }
}

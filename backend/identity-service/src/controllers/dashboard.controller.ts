import { Request, Response } from 'express';
import { sendResponse } from '../utils/response';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ORDER_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3004';

export class DashboardController {
  public async getDashboardStats(req: Request, res: Response) {
    try {
      // 1. Get total users from Identity Service's own DB
      const totalUsers = await prisma.user.count();

      // 2. Get order stats from Order Service (cross-service call)
      let orderStats = {
        totalOrders: 0,
        totalRevenue: 0,
        recentStats: []
      };

      try {
        const response = await axios.get(`${ORDER_URL}/api/orders/internal/stats`);
        if (response.data && response.data.success) {
          orderStats = response.data.data;
        }
      } catch (error: any) {
        console.error('Failed to fetch order stats from order-service:', error.message);
        // We do not throw an error here to allow partial dashboard load if order service is down
      }

      // Combine results
      return sendResponse(res, 200, true, 'Lấy thống kê dashboard thành công', {
        totalUsers,
        ...orderStats
      });
    } catch (error: any) {
      console.error('Dashboard Stats Error:', error);
      return sendResponse(res, 500, false, 'Lỗi hệ thống khi lấy thông kê dashboard');
    }
  }
}

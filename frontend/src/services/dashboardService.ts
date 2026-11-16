import api from '../lib/axios';

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  completedRevenue?: number;
  averageOrderValue?: number;
  successRate?: number;
  dateRange?: {
    startDate: string;
    endDate: string;
    daysCount: number;
  };
  peakRevenueDay?: {
    date: string;
    revenue: number;
    orders: number;
  };
  peakOrdersDay?: {
    date: string;
    orders: number;
    revenue: number;
  };
  statusBreakdown?: {
    completed: number;
    confirmed: number;
    shipping: number;
    pendingPayment: number;
    cancelled: number;
  };
  paymentBreakdown?: {
    method: string;
    count: number;
    totalAmount: number;
    percentage: number;
  }[];
  recentStats: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  topSellingProducts: {
    id: string;
    name: string;
    image?: string | null;
    soldCount: number;
    revenue: number;
  }[];
  topRecommendedProducts: {
    id: string;
    name: string;
    clicks: number;
    conversionRate: number;
  }[];
}

export interface DashboardFilterParams {
  period?: 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'custom';
  startDate?: string;
  endDate?: string;
  days?: number;
}

export const getDashboardStats = async (params?: DashboardFilterParams): Promise<DashboardStats> => {
  const response = await api.get('/admin/dashboard/stats', { params });
  return response.data.data;
};

export const sendTelegramReport = async (payload: { startDate?: string; endDate?: string; targetDate?: string }): Promise<any> => {
  const response = await api.post('/telegram/send-report', payload);
  return response.data;
};

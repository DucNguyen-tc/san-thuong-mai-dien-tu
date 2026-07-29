import api from '../lib/axios';

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  recentStats: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  topSellingProducts: {
    id: string;
    name: string;
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

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/admin/dashboard/stats');
  return response.data.data;
};

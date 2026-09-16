/**
 * Dashboard aggregate API.
 */
import { apiClient } from '@/lib/api/client';
import type { Order } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/authStore';
import { cacheConfig } from '@/lib/query';

export interface DashboardSummary {
  totalPatients: number;
  todayPatients: number;
  totalOrders: number;
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  recentOrders: Order[];
}

export const dashboardAPI = {
  getSummary(): Promise<DashboardSummary> {
    return apiClient.get<DashboardSummary>('/dashboard/summary');
  },
};

export function useDashboardSummary() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const query = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardAPI.getSummary(),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
  });

  return {
    summary: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

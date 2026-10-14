/**
 * Report listing API — reportable orders from server projection.
 */
import { apiClient } from '@/lib/api/client';
import { WORKFLOW_QUERY_LIMIT } from '@/lib/api/constants';
import type { Order } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/authStore';
import { queryKeys, cacheConfig } from '@/lib/query';
import type { ReportableOrder } from '../types';
import { calculateAge } from '@/utils';

export interface ReportableOrderItem {
  orderId: number;
  orderDate: string;
  patientId: number;
  patientName: string;
  patientDob?: string | null;
  patientGender?: string | null;
  activeTestCount: number;
  validatedTestCount: number;
  order: Order;
}

/**
 * Maps the API list item into the client ReportableOrder shape, including derived age.
 */
function toReportableOrder(item: ReportableOrderItem): ReportableOrder {
  const age = item.patientDob ? calculateAge(item.patientDob) : undefined;
  return {
    orderId: item.orderId,
    orderDate: item.orderDate,
    patientId: item.patientId,
    patientName: item.patientName,
    patientAge: age,
    patientGender: item.patientGender ?? undefined,
    activeTestCount: item.activeTestCount,
    validatedTestCount: item.validatedTestCount,
    order: item.order,
  };
}

export const reportsAPI = {
  getReportableOrders(limit = WORKFLOW_QUERY_LIMIT): Promise<ReportableOrderItem[]> {
    return apiClient.get<ReportableOrderItem[]>('/reports/orders', {
      limit: String(limit),
    });
  },
  recordOrderReportDownload(orderId: number): Promise<ReportableOrderItem> {
    return apiClient.get<ReportableOrderItem>(`/reports/orders/${orderId}/download`);
  },
};

export function useReportableOrders() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const query = useQuery({
    queryKey: queryKeys.reports.reportableOrders(),
    queryFn: () => reportsAPI.getReportableOrders(),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
    select: (items: ReportableOrderItem[]) => items.map(toReportableOrder),
  });

  return {
    reportableOrders: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Report listing API — reportable orders from server projection.
 */
import { apiClient } from '@/lib/api/client';
import { WORKFLOW_QUERY_LIMIT } from '@/lib/api/constants';
import type { Order } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { queryKeys, cacheConfig, useAuthQueryEnabled } from '@/lib/query';
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
  getReportableOrder(orderId: number): Promise<ReportableOrderItem> {
    return apiClient.get<ReportableOrderItem>(`/reports/orders/${orderId}`);
  },
  recordOrderReportDownload(orderId: number): Promise<ReportableOrderItem> {
    return apiClient.get<ReportableOrderItem>(`/reports/orders/${orderId}/download`);
  },
};

const EMPTY_REPORTABLE_ORDERS: ReportableOrder[] = [];

export function useReportableOrders() {
  const enabled = useAuthQueryEnabled();
  const query = useQuery({
    queryKey: queryKeys.reports.reportableOrders(),
    queryFn: () => reportsAPI.getReportableOrders(),
    enabled,
    ...cacheConfig.dynamic,
    select: (items: ReportableOrderItem[]) => items.map(toReportableOrder),
  });

  return {
    reportableOrders: query.data ?? EMPTY_REPORTABLE_ORDERS,
    isLoading: query.isLoading,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Load a single reportable order for the detail/preview route.
 * Falls back to the list cache so a missing/404 detail endpoint still opens preview
 * for a row the user just clicked.
 */
export function useReportableOrder(orderId: number | null) {
  const enabled = useAuthQueryEnabled(orderId != null && Number.isFinite(orderId));
  const listQuery = useQuery({
    queryKey: queryKeys.reports.reportableOrders(),
    queryFn: () => reportsAPI.getReportableOrders(),
    enabled,
    ...cacheConfig.dynamic,
    select: (items: ReportableOrderItem[]) => items.map(toReportableOrder),
  });
  const detailQuery = useQuery({
    queryKey: queryKeys.reports.byOrder(orderId ?? 0),
    queryFn: () => reportsAPI.getReportableOrder(orderId!),
    enabled,
    ...cacheConfig.dynamic,
    select: (item: ReportableOrderItem) => toReportableOrder(item),
  });

  const fromList =
    orderId == null
      ? null
      : (listQuery.data?.find(order => order.orderId === orderId) ?? null);
  const reportableOrder = detailQuery.data ?? fromList;

  return {
    reportableOrder,
    isPending: !reportableOrder && (detailQuery.isPending || listQuery.isPending),
    isLoading: !reportableOrder && (detailQuery.isLoading || listQuery.isLoading),
    isError: !reportableOrder && detailQuery.isFetched && listQuery.isFetched && (detailQuery.isError || !fromList),
    error: detailQuery.error ?? listQuery.error,
    refetch: () => {
      void detailQuery.refetch();
      void listQuery.refetch();
    },
  };
}

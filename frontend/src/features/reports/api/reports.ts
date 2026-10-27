/**
 * Report listing API — reportable orders from server projection.
 */
import { apiClient } from '@/lib/api/client';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import type { Order, OrderStatus } from '@/types';
import type { StatusPresentation } from '@/types/labProjection';
import type { PaginatedResponse } from '@/types/pagination';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useResettablePage } from '@/hooks/useResettablePage';
import { queryKeys, cacheConfig, useAuthQueryEnabled } from '@/lib/query';
import type { ReportableOrder } from '../types';
import { calculateAge } from '@/utils';

export interface ReportableOrderItem {
  orderId: number;
  orderDate: string;
  overallStatus: OrderStatus;
  statusPresentation: StatusPresentation;
  patientId: number;
  patientName: string;
  patientDob?: string | null;
  patientGender?: string | null;
  patientEmail?: string | null;
  patientPhone?: string | null;
  activeTestCount: number;
  validatedTestCount: number;
  testCodes?: string[];
  testNames?: string[];
  /** Nested order is hydrated only on GET /reports/orders/{id}. */
  order?: Order | null;
}

export interface ReportableOrdersFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Maps the API list item into the client ReportableOrder shape, including derived age.
 */
/**
 * Maps the API DTO (list or detail) into the client ReportableOrder shape.
 */
export function toReportableOrder(item: ReportableOrderItem): ReportableOrder {
  const age = item.patientDob ? calculateAge(item.patientDob) : undefined;
  return {
    orderId: item.orderId,
    orderDate: item.orderDate,
    overallStatus: item.overallStatus,
    statusPresentation: item.statusPresentation,
    patientId: item.patientId,
    patientName: item.patientName,
    patientAge: age,
    patientDob: item.patientDob ?? undefined,
    patientGender: item.patientGender ?? undefined,
    patientEmail: item.patientEmail ?? undefined,
    patientPhone: item.patientPhone ?? undefined,
    activeTestCount: item.activeTestCount,
    validatedTestCount: item.validatedTestCount,
    testCodes: item.testCodes ?? [],
    testNames: item.testNames ?? [],
    order: item.order ?? undefined,
  };
}

/**
 * Peek paginated list cache for a row the user just clicked (placeholder only).
 */
function findReportableOrderInPaginatedCache(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId: number | null
): ReportableOrderItem | undefined {
  if (orderId == null) return undefined;
  const queries = queryClient.getQueriesData<PaginatedResponse<ReportableOrderItem>>({
    queryKey: [...queryKeys.reports.all, 'paginated'],
  });
  for (const [, page] of queries) {
    const found = page?.data?.find(item => item.orderId === orderId);
    if (found) return found;
  }
  return undefined;
}

export const reportsAPI = {
  getPaginated(
    filters?: ReportableOrdersFilters & { page?: number; pageSize?: number }
  ): Promise<PaginatedResponse<ReportableOrderItem>> {
    const pageSize = filters?.pageSize || DEFAULT_LIST_PAGE_SIZE;
    const params: Record<string, string> = {
      skip: String(((filters?.page ?? 1) - 1) * pageSize),
      limit: String(pageSize),
    };
    if (filters?.search) params.search = filters.search;
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    return apiClient.get<PaginatedResponse<ReportableOrderItem>>('/reports/orders', params);
  },
  getReportableOrder(orderId: number): Promise<ReportableOrderItem> {
    return apiClient.get<ReportableOrderItem>(`/reports/orders/${orderId}`);
  },
  recordOrderReportDownload(orderId: number): Promise<ReportableOrderItem> {
    return apiClient.get<ReportableOrderItem>(`/reports/orders/${orderId}/download`);
  },
};

const EMPTY_PAGINATION = {
  page: 1,
  pageSize: DEFAULT_LIST_PAGE_SIZE,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

/**
 * Server-paginated reportable orders. Resets to page 1 when filters change.
 */
export function usePaginatedReportableOrders(
  filters?: ReportableOrdersFilters,
  initialPage = 1,
  pageSize = DEFAULT_LIST_PAGE_SIZE
) {
  const enabled = useAuthQueryEnabled();
  const filterSnapshot = JSON.stringify(filters ?? null);
  const [page, setPage] = useResettablePage(initialPage, filterSnapshot);

  const query = useQuery({
    queryKey: queryKeys.reports.paginated({
      ...filters,
      page,
      pageSize,
    }),
    queryFn: () =>
      reportsAPI.getPaginated({
        ...filters,
        page,
        pageSize,
      }),
    enabled,
    placeholderData: keepPreviousData,
    ...cacheConfig.dynamic,
  });

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, [setPage]);

  const resetPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  return {
    reportableOrders: (query.data?.data ?? []).map(toReportableOrder),
    pagination: query.data?.pagination ?? { ...EMPTY_PAGINATION, pageSize, page },
    isLoading: query.isLoading,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    page,
    goToPage,
    resetPage,
  };
}

/**
 * Load one reportable order by id. Uses the current paginated page as placeholder
 * so preview can open immediately after a row click.
 */
export function useReportableOrder(orderId: number | null) {
  const queryClient = useQueryClient();
  const enabled = useAuthQueryEnabled(orderId != null && Number.isFinite(orderId));

  const query = useQuery({
    queryKey: queryKeys.reports.byOrder(orderId ?? 0),
    queryFn: () => reportsAPI.getReportableOrder(orderId!),
    enabled,
    ...cacheConfig.dynamic,
    placeholderData: () => findReportableOrderInPaginatedCache(queryClient, orderId),
    select: (item: ReportableOrderItem) => toReportableOrder(item),
  });

  return {
    reportableOrder: query.data,
    isPending: query.isPending,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

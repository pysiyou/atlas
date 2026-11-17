/**
 * Report listing API — reportable orders from server projection.
 */
import { apiClient } from '@/lib/api';
import { clinicalPath } from '@/lib/api/clinicalPath';
import { orderIdSchema } from '@/types/zod';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api';
import { withPaginatedParams } from '@/lib/api';
import type { ApiReportableOrderItem } from '@/lib/api/types';
import type { Order } from '@/types';
import type { PaginatedResponse } from '@/types';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useResettablePage } from '@/hooks';
import { usePaginatedPageSize } from '@/hooks';
import { queryKeys, cacheConfig, useAuthQueryEnabled } from '@/lib/query';
import type { ReportableOrder } from '@/types';
import { calculateAge } from '@/utils';

export type ReportableOrderItem = ApiReportableOrderItem & {
  /** Nested order is hydrated only on GET /reports/orders/{id}. */
  order?: Order | null;
};

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
    statusPresentation: item.statusPresentation ?? {
      primary: item.overallStatus,
      variant: 'gray',
    },
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
  orderId: string | null
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
      ...withPaginatedParams({}, filters?.page ?? 1, pageSize),
    };
    if (filters?.search) params.search = filters.search;
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    return apiClient.get<PaginatedResponse<ReportableOrderItem>>('/reports/orders', params);
  },
  getReportableOrder(orderId: string): Promise<ReportableOrderItem> {
    return apiClient.get<ReportableOrderItem>(
      clinicalPath('/reports/orders', orderId, orderIdSchema),
    );
  },
  recordOrderReportDownload(orderId: string): Promise<ReportableOrderItem> {
    return apiClient.get<ReportableOrderItem>(
      `${clinicalPath('/reports/orders', orderId, orderIdSchema)}/download`,
    );
  },
  downloadPdf(orderId: string): Promise<Blob> {
    return apiClient.getBlob(`${clinicalPath('/reports/orders', orderId, orderIdSchema)}/pdf`);
  },
};

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadServerReportPdf(orderId: string): Promise<void> {
  const blob = await reportsAPI.downloadPdf(orderId);
  triggerBlobDownload(blob, `lab-report-${orderId}.pdf`);
}

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
  initialPageSize = DEFAULT_LIST_PAGE_SIZE
) {
  const enabled = useAuthQueryEnabled();
  const filterSnapshot = JSON.stringify(filters ?? null);
  const [page, setPage] = useResettablePage(initialPage, filterSnapshot);
  const { pageSize, setPageSize: setPageSizeState } = usePaginatedPageSize(initialPageSize);

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

  const setPageSize = useCallback(
    (size: number) => {
      setPageSizeState(size);
      setPage(1);
    },
    [setPageSizeState, setPage]
  );

  const pagination = query.data?.pagination ?? { ...EMPTY_PAGINATION, pageSize, page };

  return {
    reportableOrders: (query.data?.data ?? []).map(toReportableOrder),
    pagination: { ...pagination, page, pageSize },
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
    setPageSize,
  };
}

/**
 * Load one reportable order by id. Uses the current paginated page as placeholder
 * so preview can open immediately after a row click.
 */
export function useReportableOrder(orderId: string | null) {
  const queryClient = useQueryClient();
  const enabled = useAuthQueryEnabled(orderId != null && orderId !== '');

  const query = useQuery({
    queryKey: queryKeys.reports.byOrder(orderId ?? ''),
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

/* eslint-disable max-lines -- colocated HTTP service + React Query hooks */
/**
 * Order HTTP + query/mutation hooks.
 * Convention: `*API` objects are pure fetch; `use*` hooks wrap TanStack Query (same file).
 */
import { apiClient } from '@/lib/api/client';
import { withPaginatedParams } from '@/lib/api/pagination';
import { WORKFLOW_QUERY_LIMIT, DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import type { ApiOrderSummaryResponse } from '@/lib/api/types';
import type { Order, OrderStatus, PaymentMethod, PaymentStatus, Patient, Invoice } from '@/types';
import type { PaginatedResponse, PaginationMeta } from '@/types/pagination';
import { serializeQueryList } from '@/utils/filtering';
import { useQuery, keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useResettablePage } from '@/hooks/useResettablePage';
import { usePaginatedPageSize } from '@/hooks/usePaginatedPageSize';
import { queryKeys, cacheConfig, useAuthQueryEnabled } from '@/lib/query';
import { invalidateOrderQueries } from '@/lib/query/invalidate';
import { notify } from '@/feedback';
import { orderCreateSchema, orderUpdateSchema, orderSchema } from '@/features/orders/schemas/order.schema';
import { formInputToPayload } from '../utils/formTransformers';

export type { PaginatedResponse, PaginationMeta };

/** Invoice payload on order detail (`include=invoices`) — API uses `paymentStatus`. */
export interface OrderDetailInvoice {
  invoiceId: number;
  orderId: number;
  patientId: number;
  patientName: string;
  items: Invoice['items'];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  amountDue: number;
  createdAt: string;
  updatedAt?: string;
  dueDate?: string | null;
}

export interface OrderDetailApiResponse extends Order {
  patient?: Patient;
  invoices?: OrderDetailInvoice[];
  payments?: unknown[];
}

export interface OrdersFilter {
  patientId?: string;
  orderId?: number;
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  paymentMethod?: PaymentMethod[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  /** List embeds, e.g. latestPayment */
  include?: string;
}

export const orderAPI = {
  async getPaginated(filters?: OrdersFilter & { summary?: boolean }): Promise<PaginatedResponse<Order>> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? DEFAULT_LIST_PAGE_SIZE;
    const params: Record<string, string> = {
      paginated: 'true',
      sort: 'updatedAt',
      summary: 'true',
      ...withPaginatedParams({}, page, pageSize),
    };

    if (filters?.patientId) params.patientId = filters.patientId;
    if (filters?.orderId) params.orderId = String(filters.orderId);
    const statusParam = serializeQueryList(filters?.status);
    if (statusParam) params.status = statusParam;
    const paymentStatusParam = serializeQueryList(filters?.paymentStatus);
    if (paymentStatusParam) params.paymentStatus = paymentStatusParam;
    const paymentMethodParam = serializeQueryList(filters?.paymentMethod);
    if (paymentMethodParam) params.paymentMethod = paymentMethodParam;
    if (filters?.search) params.search = filters.search;
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    if (filters?.include) params.include = filters.include;

    return apiClient.get<PaginatedResponse<ApiOrderSummaryResponse & Order>>('/orders', params);
  },

  async getById(
    orderId: string,
    options?: { signal?: AbortSignal; include?: string }
  ): Promise<OrderDetailApiResponse | null> {
    const params = options?.include ? { include: options.include } : undefined;
    return apiClient.get<OrderDetailApiResponse>(`/orders/${orderId}`, params, {
      signal: options?.signal,
    });
  },

  async getByPatientId(patientId: string): Promise<Order[]> {
    return apiClient.get<Order[]>('/orders', {
      patientId,
      sort: 'updatedAt',
      paginated: 'false',
      summary: 'true',
      limit: String(WORKFLOW_QUERY_LIMIT),
    });
  },

  async create(order: Partial<Order>): Promise<Order> {
    return apiClient.post<Order>('/orders', order);
  },

  async update(orderId: string, updates: Partial<Order>): Promise<Order> {
    return apiClient.put<Order>(`/orders/${orderId}`, updates);
  },

  async delete(orderId: string): Promise<void> {
    return apiClient.delete<void>(`/orders/${orderId}`);
  },

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: string,
    amountPaid?: number
  ): Promise<Order> {
    return apiClient.patch<Order>(`/orders/${orderId}/payment`, {
      paymentStatus,
      amountPaid,
    });
  },

  async approveForCollection(orderId: string): Promise<{
    orderId: number;
    doctorApprovedBy: string;
    doctorApprovedAt: string;
    message: string;
  }> {
    return apiClient.post(`/orders/${orderId}/approve`);
  },
};

/**
 * Order API hooks — React Query layer.
 */
/**
 * Order Query Hooks
 * Provides read-only access to order data with caching
 */

/**
 * Filter options for orders list
 */
export interface OrdersFilters {
  patientId?: string;
  orderId?: number;
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  paymentMethod?: PaymentMethod[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  include?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(
  orderId: string | undefined,
  options?: { include?: string }
) {
  const enabled = useAuthQueryEnabled(Boolean(orderId));
  const include = options?.include ?? 'patient,invoices';

  const query = useQuery({
    queryKey: [...queryKeys.orders.byId(orderId ?? ''), include],
    queryFn: async ({ signal }) => {
      const data = await orderAPI.getById(orderId!, { signal, include });
      if (!data) throw new Error('Order not found');
      return data;
    },
    enabled,
    ...cacheConfig.dynamic,
  });

  return {
    order: query.data,
    patient: query.data?.patient ?? null,
    invoices: query.data?.invoices ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get orders for one patient from the patient-scoped endpoint.
 * Avoids fetching the workflow-wide 500-order list just to client-filter.
 */
export function useOrdersByPatient(patientId: string | undefined) {
  const enabled = useAuthQueryEnabled(Boolean(patientId));

  const query = useQuery({
    queryKey: queryKeys.orders.byPatient(patientId ?? ''),
    queryFn: () => orderAPI.getByPatientId(patientId!),
    enabled,
    ...cacheConfig.dynamic,
  });

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
  };
}

/**
 * Hook to fetch paginated orders with server-side filtering
 *
 * Use this for large datasets where client-side filtering is not practical.
 * Keeps previous data visible while fetching new page.
 */
export function usePaginatedOrders(filters?: OrdersFilters, initialPage = 1, initialPageSize = DEFAULT_LIST_PAGE_SIZE) {
  const enabled = useAuthQueryEnabled();
  const filterSnapshot = JSON.stringify(filters ?? null);
  const [page, setPage] = useResettablePage(initialPage, filterSnapshot);
  const { pageSize, setPageSize: setPageSizeState } = usePaginatedPageSize(initialPageSize);

  const query = useQuery({
    queryKey: queryKeys.orders.paginated({
      ...filters,
      page,
      pageSize,
    }),
    queryFn: () =>
      orderAPI.getPaginated({
        ...filters,
        page,
        pageSize,
      }),
    enabled,
    // Keep showing previous data while fetching new page
    placeholderData: keepPreviousData,
    ...cacheConfig.dynamic,
  });

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, [setPage]);

  const resetPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const nextPage = useCallback(() => {
    if (query.data?.pagination.hasNext) {
      setPage(p => p + 1);
    }
  }, [query.data?.pagination.hasNext, setPage]);

  const prevPage = useCallback(() => {
    if (query.data?.pagination.hasPrev) {
      setPage(p => p - 1);
    }
  }, [query.data?.pagination.hasPrev, setPage]);

  const setPageSize = useCallback(
    (size: number) => {
      setPageSizeState(size);
      setPage(1);
    },
    [setPageSizeState, setPage]
  );

  const pagination = query.data?.pagination ?? {
    page: 1,
    pageSize,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };

  return {
    orders: query.data?.data ?? [],
    pagination: { ...pagination, page, pageSize },
    isLoading: query.isLoading,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    // Pagination controls
    page,
    goToPage,
    resetPage,
    nextPage,
    prevPage,
    setPageSize,
  };
}

/**
 * Order Mutation Hooks
 * Provides hooks for creating, updating, and deleting orders
 */

/**
 * Mutation hook to create a new order with Zod validation.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: unknown) => {
      const validated = orderCreateSchema.parse(input);
      const transformed = formInputToPayload(validated);
      const response = await orderAPI.create(transformed);
      return orderSchema.parse(response) as Order;
    },
    onSuccess: async () => {
      await invalidateOrderQueries(queryClient, { samples: true });
      notify.show('order.create.success');
    },
    onError: error => {
      notify.apiError('order.create.error', error);
    },
  });
}

/**
 * Mutation hook to update an existing order with Zod validation and optimistic updates.
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: number; data: unknown }) => {
      const validated = orderUpdateSchema.parse(data);
      const transformed = formInputToPayload(validated, { includePatientId: false });
      const response = await orderAPI.update(orderId.toString(), transformed);
      return orderSchema.parse(response) as Order;
    },
    onMutate: async ({ orderId, data }) => {
      const orderIdStr = orderId.toString();

      await queryClient.cancelQueries({ queryKey: queryKeys.orders.all });

      const previousOrder = queryClient.getQueryData<Order>(queryKeys.orders.byId(orderIdStr));

      if (previousOrder) {
        queryClient.setQueryData<Order>(queryKeys.orders.byId(orderIdStr), {
          ...previousOrder,
          ...(typeof data === 'object' && data !== null ? data : {}),
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousOrder };
    },
    onError: (error, variables, context) => {
      const orderIdStr = variables.orderId.toString();
      if (context?.previousOrder) {
        queryClient.setQueryData(queryKeys.orders.byId(orderIdStr), context.previousOrder);
      }
      notify.apiError('order.update.error', error);
    },
    onSuccess: () => {
      notify.show('order.update.success');
    },
    onSettled: (_, __, variables) => {
      const orderIdStr = variables.orderId.toString();
      return invalidateOrderQueries(queryClient, { orderId: orderIdStr, samples: true });
    },
  });
}

/**
 * Mutation hook to delete an order
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number | string) => {
      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      return orderAPI.delete(orderIdStr);
    },
    onSuccess: async () => {
      await invalidateOrderQueries(queryClient, { samples: true });
      notify.show('order.delete.success');
    },
    onError: error => {
      notify.apiError('order.delete.error', error);
    },
  });
}

/**
 * Mutation hook to update payment status
 */
export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      paymentStatus,
      amountPaid,
    }: {
      orderId: number | string;
      paymentStatus: string;
      amountPaid?: number;
    }) => {
      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      return orderAPI.updatePaymentStatus(orderIdStr, paymentStatus, amountPaid);
    },
    onSuccess: async (_, variables) => {
      const orderIdStr =
        typeof variables.orderId === 'string' ? variables.orderId : variables.orderId.toString();
      await invalidateOrderQueries(queryClient, { orderId: orderIdStr, payments: true });
      notify.show('order.paymentStatus.success');
    },
  });
}

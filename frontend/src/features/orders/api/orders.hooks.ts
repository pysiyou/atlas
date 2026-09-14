/**
 * Order API hooks — React Query layer.
 */
/* eslint-disable max-lines -- hooks module aggregates query/mutation hooks */

import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import { useQuery, keepPreviousData, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { useMemo, useState, useCallback } from 'react';
import { queryKeys, cacheConfig } from '@/lib/query';
import { invalidateOrderQueries } from '@/lib/query/invalidate';
import { notify } from '@/utils/feedback';
import { useAuthStore } from '@/app/store';
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import type { PaginatedResponse, PaginationMeta } from '@/types/pagination';
import {
  orderCreateSchema,
  orderUpdateSchema,
  orderSchema,
} from '@/features/orders/schemas/order.schema';
import { formInputToPayload } from '../utils/formTransformers';
import { orderAPI } from './orders.service';

export { orderAPI, type OrdersFilter } from './orders.service';
export type { PaginatedResponse, PaginationMeta };


/**
 * Order Query Hooks
 * Provides read-only access to order data with caching
 */

/**
 * Filter options for orders list
 */
export interface OrdersFilters {
  patientId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Fetch orders for a set of patient IDs (paginated list enrichment).
 */
export function useOrdersForPatientIds(patientIds: number[]) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const queries = useQueries({
    queries: patientIds.map(patientId => ({
      queryKey: queryKeys.orders.byPatient(String(patientId)),
      queryFn: () => orderAPI.getByPatientId(String(patientId)),
      enabled: isAuthenticated && !isRestoring && patientId > 0,
      ...cacheConfig.dynamic,
    })),
  });

  const orders = useMemo(
    () => queries.flatMap(query => query.data ?? []),
    [queries]
  );

  const isLoading = queries.some(query => query.isLoading);

  return { orders, isLoading };
}

/**
 * Hook to fetch and cache workflow-scoped orders (client-side filtering applied from filters).
 * For large datasets (hundreds/thousands of orders), prefer usePaginatedOrders to avoid over-fetching.
 */
export interface LabQueryRefetchOptions {
  refetchInterval?: number;
}

export function useOrdersList(filters?: OrdersFilters, refetchOptions?: LabQueryRefetchOptions) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: ({ signal }) => orderAPI.getAll({ signal }),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
    ...(refetchOptions?.refetchInterval != null
      ? { refetchInterval: refetchOptions.refetchInterval }
      : {}),
  });

  // Apply client-side filters for instant filtering on cached data
  const filteredOrders = useMemo(() => {
    let orders = query.data ?? [];

    if (filters?.patientId) {
      const numericPatientId =
        typeof filters.patientId === 'string' ? parseInt(filters.patientId, 10) : filters.patientId;
      orders = orders.filter(o => o.patientId === numericPatientId);
    }
    if (filters?.status) {
      orders = orders.filter(o => o.overallStatus === filters.status);
    }
    if (filters?.paymentStatus) {
      orders = orders.filter(o => o.paymentStatus === filters.paymentStatus);
    }

    return orders;
  }, [query.data, filters]);

  return {
    orders: filteredOrders,
    allOrders: query.data ?? [],
    isLoading: query.isLoading,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(orderId: string | undefined) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.orders.byId(orderId ?? ''),
    queryFn: async ({ signal }) => {
      const data = await orderAPI.getById(orderId!, { signal });
      if (!data) throw new Error('Order not found');
      return data;
    },
    enabled: isAuthenticated && !isRestoring && !!orderId,
    ...cacheConfig.dynamic,
  });

  return {
    order: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get orders by patient ID using cached data
 */
export function useOrdersByPatient(patientId: string | undefined) {
  const { orders, isLoading } = useOrdersList();

  const patientOrders = useMemo(() => {
    if (!patientId) return [];
    const numericPatientId = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;
    if (isNaN(numericPatientId)) return [];
    return orders.filter(o => o.patientId === numericPatientId);
  }, [orders, patientId]);

  return {
    orders: patientOrders,
    isLoading,
  };
}

/**
 * Hook to get orders by status using cached data
 */
export function useOrdersByStatus(status: OrderStatus | undefined) {
  const { orders, isLoading } = useOrdersList();

  const filteredOrders = useMemo(() => {
    if (!status) return orders;
    return orders.filter(o => o.overallStatus === status);
  }, [orders, status]);

  return {
    orders: filteredOrders,
    isLoading,
  };
}

/**
 * Hook to fetch paginated orders with server-side filtering
 *
 * Use this for large datasets where client-side filtering is not practical.
 * Keeps previous data visible while fetching new page.
 */
export function usePaginatedOrders(filters?: OrdersFilters, initialPage = 1, pageSize = DEFAULT_LIST_PAGE_SIZE) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const [page, setPage] = useState(initialPage);
  const [prevFilters, setPrevFilters] = useState(filters);

  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setPage(initialPage);
  }

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
    enabled: isAuthenticated && !isRestoring,
    // Keep showing previous data while fetching new page
    placeholderData: keepPreviousData,
    ...cacheConfig.dynamic,
  });

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  const nextPage = useCallback(() => {
    if (query.data?.pagination.hasNext) {
      setPage(p => p + 1);
    }
  }, [query.data?.pagination.hasNext]);

  const prevPage = useCallback(() => {
    if (query.data?.pagination.hasPrev) {
      setPage(p => p - 1);
    }
  }, [query.data?.pagination.hasPrev]);

  return {
    orders: query.data?.data ?? [],
    pagination: query.data?.pagination ?? {
      page: 1,
      pageSize,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
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
  };
}

/**
 * Hook that uses select to return order summary statistics.
 * Uses the same cached data as useOrdersList but derives summary stats.
 * Re-renders only when the summary changes, not on every order change.
 *
 * This demonstrates the TanStack Query select pattern for computing
 * derived data efficiently.
 *
 * @returns Order statistics { total, byStatus, byPaymentStatus }
 *
 * @example
 * ```tsx
 * const { stats, isLoading } = useOrderStats();
 * // stats.total = 150
 * // stats.byStatus['in-progress'] = 45
 * ```
 */
export function useOrderStats() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.orders.list(),
    queryFn: () => orderAPI.getAll(),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
    // SELECT PATTERN: Compute statistics from orders
    // Only re-renders when the stats actually change
    select: (orders: Order[]) => {
      const byStatus: Record<string, number> = {};
      const byPaymentStatus: Record<string, number> = {};

      orders.forEach(order => {
        // Count by status
        const status = order.overallStatus;
        byStatus[status] = (byStatus[status] || 0) + 1;

        // Count by payment status
        const paymentStatus = order.paymentStatus;
        byPaymentStatus[paymentStatus] = (byPaymentStatus[paymentStatus] || 0) + 1;
      });

      return {
        total: orders.length,
        byStatus,
        byPaymentStatus,
        unpaidCount: byPaymentStatus['unpaid'] || 0,
        inProgressCount: byStatus['in-progress'] || 0,
      };
    },
  });

  return {
    stats: query.data ?? {
      total: 0,
      byStatus: {},
      byPaymentStatus: {},
      unpaidCount: 0,
      inProgressCount: 0,
    },
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Hook that uses select to return a specific order's summary.
 * Extracts just the fields needed for display, avoiding re-renders
 * when other order fields change.
 *
 * @param orderId - The order ID
 * @returns Order summary or null if not found
 *
 * @example
 * ```tsx
 * const summary = useOrderSummary('123');
 * // summary = { orderId: 123, totalTests: 5, pendingTests: 2, totalAmount: 1500 }
 * ```
 */
export function useOrderSummary(orderId: string | undefined) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.orders.byId(orderId ?? ''),
    queryFn: async () => {
      const data = await orderAPI.getById(orderId!);
      if (!data) throw new Error('Order not found');
      return data;
    },
    enabled: isAuthenticated && !isRestoring && !!orderId,
    ...cacheConfig.dynamic,
    // SELECT PATTERN: Extract only summary fields
    select: (order: Order) => ({
      orderId: order.orderId,
      patientName: order.patientName,
      totalTests: order.tests.length,
      pendingTests: order.tests.filter(t =>
        ['pending', 'sample-collected', 'resulted', 'escalated'].includes(t.status)
      ).length,
      completedTests: order.tests.filter(t => t.status === 'validated').length,
      totalAmount: order.totalPrice,
      isPaid: order.paymentStatus === 'paid',
      status: order.overallStatus,
    }),
  });

  return query.data ?? null;
}

/**
 * Hook that uses select to return recent orders (last 7 days).
 * Filters and transforms the cached order list.
 *
 * @param limit - Maximum number of orders to return (default: 10)
 * @returns Recent orders array
 *
 * @example
 * ```tsx
 * const { recentOrders, isLoading } = useRecentOrders(5);
 * ```
 */
export function useRecentOrders(limit = 10) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  }, []);

  const query = useQuery({
    queryKey: queryKeys.orders.list(),
    queryFn: () => orderAPI.getAll(),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
    // SELECT PATTERN: Filter to recent orders and limit
    select: (orders: Order[]) =>
      orders
        .filter(order => new Date(order.orderDate) >= sevenDaysAgo)
        .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
        .slice(0, limit)
        .map(order => ({
          orderId: order.orderId,
          patientName: order.patientName,
          orderDate: order.orderDate,
          status: order.overallStatus,
          testCount: order.tests.length,
        })),
  });

  return {
    recentOrders: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
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
    onSuccess: () => {
      invalidateOrderQueries(queryClient, { samples: true });
      notify.toast('order.create.success');
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
      const transformed = formInputToPayload(validated);
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
    onSuccess: (_, variables) => {
      invalidateOrderQueries(queryClient, { orderId: variables.orderId.toString(), samples: true });
      notify.toast('order.update.success');
    },
    onSettled: (_, __, variables) => {
      const orderIdStr = variables.orderId.toString();
      invalidateOrderQueries(queryClient, { orderId: orderIdStr, samples: true });
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
    onSuccess: () => {
      invalidateOrderQueries(queryClient, { samples: true });
      notify.toast('order.delete.success');
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
    onSuccess: (_, variables) => {
      const orderIdStr =
        typeof variables.orderId === 'string' ? variables.orderId : variables.orderId.toString();
      invalidateOrderQueries(queryClient, { orderId: orderIdStr, payments: true });
      notify.toast('order.paymentStatus.success');
    },
  });
}

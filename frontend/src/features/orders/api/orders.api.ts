/**
 * Order API Service + React Query hooks
 */
/* eslint-disable max-lines -- API module aggregates service methods and React Query hooks */

import { apiClient } from '@/lib/apiClient';
import { useQuery, keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useCallback } from 'react';
import { queryKeys, cacheConfig } from '@/lib/query';
import { invalidateOrderQueries } from '@/lib/query/invalidate';
import { getErrorMessage } from '@/utils/errors';
import { toast } from '@/app/AppToastBar';
import { useAuthStore } from '@/app/store';
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import type { PaginatedResponse, PaginationMeta } from '@/types/pagination';
import {
  orderCreateSchema,
  orderUpdateSchema,
  orderSchema,
} from '@/features/orders/schemas/order.schema';
import { formInputToPayload } from '../utils/formTransformers';

export type { PaginatedResponse, PaginationMeta };

/**
 * Filter options for orders list
 */
export interface OrdersFilter {
  patientId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  page?: number;
  pageSize?: number;
}

export const orderAPI = {
  /**
   * Get all orders (requests up to backend max so tables can show full list)
   */
  async getAll(options?: { signal?: AbortSignal }): Promise<Order[]> {
    return apiClient.get<Order[]>('/orders', { limit: '10000', sort: 'updatedAt' }, options);
  },

  /**
   * Get orders with pagination
   */
  async getPaginated(filters?: OrdersFilter): Promise<PaginatedResponse<Order>> {
    const params: Record<string, string> = { paginated: 'true', sort: 'updatedAt' };

    if (filters?.patientId) params.patientId = filters.patientId;
    if (filters?.status) params.status = filters.status;
    if (filters?.paymentStatus) params.paymentStatus = filters.paymentStatus;
    if (filters?.page) params.skip = String((filters.page - 1) * (filters.pageSize || 20));
    if (filters?.pageSize) params.limit = String(filters.pageSize);

    return apiClient.get<PaginatedResponse<Order>>('/orders', params);
  },

  /**
   * Get order by ID
   */
  async getById(orderId: string, options?: { signal?: AbortSignal }): Promise<Order | null> {
    return apiClient.get<Order>(`/orders/${orderId}`, undefined, options);
  },

  /**
   * Get orders by patient ID
   */
  async getByPatientId(patientId: string): Promise<Order[]> {
    return apiClient.get<Order[]>('/orders', { patientId, sort: 'updatedAt' });
  },

  /**
   * Create new order
   */
  async create(order: Partial<Order>): Promise<Order> {
    return apiClient.post<Order>('/orders', order);
  },

  /**
   * Update order
   */
  async update(orderId: string, updates: Partial<Order>): Promise<Order> {
    return apiClient.put<Order>(`/orders/${orderId}`, updates);
  },

  /**
   * Delete order
   */
  async delete(orderId: string): Promise<void> {
    return apiClient.delete<void>(`/orders/${orderId}`);
  },

  /**
   * Update test status within an order
   */
  async updateTestStatus(
    orderId: string,
    testCode: string,
    status: string,
    additionalData?: Record<string, unknown>
  ): Promise<Order> {
    return apiClient.patch<Order>(`/orders/${orderId}/tests/${testCode}`, {
      status,
      ...additionalData,
    });
  },

  /**
   * Mark test as having critical values
   */
  async markTestCritical(orderId: string, testCode: string, notifiedTo: string): Promise<Order> {
    return apiClient.post<Order>(`/orders/${orderId}/tests/${testCode}/critical`, { notifiedTo });
  },

  /**
   * Update payment status
   */
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
};


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
 * Hook to fetch and cache all orders (client-side filtering applied from filters).
 * For large datasets (hundreds/thousands of orders), prefer usePaginatedOrders to avoid over-fetching.
 */
export function useOrdersList(filters?: OrdersFilters) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: ({ signal }) => orderAPI.getAll({ signal }),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
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
export function usePaginatedOrders(filters?: OrdersFilters, initialPage = 1, pageSize = 20) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const [page, setPage] = useState(initialPage);

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
        ['pending', 'sample-collected', 'resulted', 'suspended', 'escalated'].includes(t.status)
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

import type { TestStatus } from '@/types';

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
      toast.success('Order created successfully');
    },
    onError: error => {
      toast.error(`Failed to create order: ${getErrorMessage(error, 'Unknown error')}`);
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
      toast.error({
        title: 'Failed to update order',
        subtitle: getErrorMessage(error, 'The order could not be updated. Please try again.'),
      });
    },
    onSuccess: (_, variables) => {
      invalidateOrderQueries(queryClient, { orderId: variables.orderId.toString(), samples: true });
      toast.success('Order updated successfully');
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
    },
    onError: error => {
      toast.error({
        title: 'Failed to delete order',
        subtitle: getErrorMessage(error, 'The order could not be deleted. Please try again.'),
      });
    },
  });
}

/**
 * Mutation hook to update test status within an order
 */
export function useUpdateTestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      testCode,
      status,
      additionalData,
    }: {
      orderId: number | string;
      testCode: string;
      status: TestStatus;
      additionalData?: Record<string, unknown>;
    }) => {
      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      return orderAPI.updateTestStatus(orderIdStr, testCode, status, additionalData);
    },
    onSuccess: (_, variables) => {
      const orderIdStr =
        typeof variables.orderId === 'string' ? variables.orderId : variables.orderId.toString();
      invalidateOrderQueries(queryClient, { orderId: orderIdStr, samples: true });
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
    },
  });
}

/**
 * Mutation hook to mark a test as having critical values
 */
export function useMarkTestCritical() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      testCode,
      notifiedTo,
    }: {
      orderId: number | string;
      testCode: string;
      notifiedTo: string;
    }) => {
      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      return orderAPI.markTestCritical(orderIdStr, testCode, notifiedTo);
    },
    onSuccess: (_, variables) => {
      const orderIdStr =
        typeof variables.orderId === 'string' ? variables.orderId : variables.orderId.toString();
      invalidateOrderQueries(queryClient, { orderId: orderIdStr, samples: false });
    },
  });
}

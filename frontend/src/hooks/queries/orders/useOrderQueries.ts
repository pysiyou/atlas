/**
 * Order Query Hooks
 * Provides read-only access to order data with caching
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useMemo, useState, useCallback } from 'react';
import { queryKeys, cacheConfig } from '@/lib/query';
import { orderAPI } from '@/services/api/orders';
import { useAuthStore } from '@/shared/stores/auth.store';
import type { OrderStatus, PaymentStatus } from '@/types';

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
    queryFn: () => orderAPI.getAll(),
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
    queryFn: () => orderAPI.getById(orderId!),
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
export function usePaginatedOrders(
  filters?: OrdersFilters,
  initialPage = 1,
  pageSize = 20
) {
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
      setPage((p) => p + 1);
    }
  }, [query.data?.pagination.hasNext]);

  const prevPage = useCallback(() => {
    if (query.data?.pagination.hasPrev) {
      setPage((p) => p - 1);
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

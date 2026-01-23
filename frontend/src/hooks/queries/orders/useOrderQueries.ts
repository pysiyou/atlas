/**
 * Order Query Hooks
 * Provides read-only access to order data with caching
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys, cacheConfig } from '@/lib/query';
import { orderAPI } from '@/services/api/orders';
import { useAuth } from '@/features/auth/useAuth';
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
 * Hook to fetch and cache all orders
 */
export function useOrdersList(filters?: OrdersFilters) {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => orderAPI.getAll(),
    enabled: isAuthenticated,
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
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.orders.byId(orderId ?? ''),
    queryFn: () => orderAPI.getById(orderId!),
    enabled: isAuthenticated && !!orderId,
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

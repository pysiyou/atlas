/**
 * Orders Query Hook
 * 
 * Provides access to order data with dynamic caching (30s stale time).
 * Orders change frequently and need fresh data with background refetching.
 * 
 * @module hooks/queries/useOrders
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { queryKeys, cacheConfig } from '@/lib/query';
import { orderAPI } from '@/services/api/orders';
import type { Order, OrderStatus, PaymentStatus, TestStatus } from '@/types';

/**
 * Filter options for orders list
 */
export interface OrdersFilters {
  patientId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

/**
 * Hook to fetch and cache all orders.
 * Uses dynamic cache - data is considered fresh for 30 seconds.
 * 
 * @param filters - Optional filters to apply
 * @returns Query result containing orders array and loading state
 * 
 * @example
 * ```tsx
 * const { orders, isLoading, error } = useOrdersList();
 * ```
 */
export function useOrdersList(filters?: OrdersFilters) {
  const query = useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => orderAPI.getAll(),
    ...cacheConfig.dynamic, // 30s stale, 5 min gc
  });

  // Apply client-side filters for instant filtering on cached data
  const filteredOrders = useMemo(() => {
    let orders = query.data ?? [];
    
    if (filters?.patientId) {
      orders = orders.filter(o => o.patientId === filters.patientId);
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
 * Hook to fetch a single order by ID.
 * 
 * @param orderId - The order ID to fetch
 * @returns Query result with order data
 * 
 * @example
 * ```tsx
 * const { order, isLoading } = useOrder('ORD-001');
 * ```
 */
export function useOrder(orderId: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.orders.byId(orderId ?? ''),
    queryFn: () => orderAPI.getById(orderId!),
    enabled: !!orderId,
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
 * Hook to get orders by patient ID.
 * Uses cached data for instant filtering.
 * 
 * @param patientId - The patient ID to filter by
 * @returns Array of orders for the patient
 */
export function useOrdersByPatient(patientId: string | undefined) {
  const { orders, isLoading } = useOrdersList();

  const patientOrders = useMemo(() => {
    if (!patientId) return [];
    return orders.filter(o => o.patientId === patientId);
  }, [orders, patientId]);

  return {
    orders: patientOrders,
    isLoading,
  };
}

/**
 * Hook to get orders by status.
 * Uses cached data for instant filtering.
 * 
 * @param status - The order status to filter by
 * @returns Array of orders with the specified status
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
 * Hook to search orders by order ID.
 * 
 * @param searchQuery - Search query string
 * @returns Filtered array of orders
 */
export function useOrderSearch(searchQuery: string) {
  const { orders, isLoading } = useOrdersList();

  const results = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter(order =>
      order.orderId.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  return {
    results,
    isSearching: isLoading,
  };
}

/**
 * Hook to get order lookup function.
 * Returns functions to resolve order IDs to orders.
 * 
 * @returns Object with getOrder function
 */
export function useOrderLookup() {
  const { orders, isLoading } = useOrdersList();

  const ordersMap = useMemo(() => {
    const map = new Map<string, Order>();
    orders.forEach(o => map.set(o.orderId, o));
    return map;
  }, [orders]);

  const getOrder = useCallback((orderId: string): Order | undefined => {
    return ordersMap.get(orderId);
  }, [ordersMap]);

  return {
    getOrder,
    isLoading,
  };
}

/**
 * Mutation hook to create a new order.
 * Invalidates the orders list cache on success.
 * 
 * @returns Mutation result with mutate function
 * 
 * @example
 * ```tsx
 * const { mutate: createOrder, isPending } = useCreateOrder();
 * createOrder(newOrderData);
 * ```
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: Partial<Order>) => orderAPI.create(order),
    onSuccess: () => {
      // Invalidate orders and samples (samples are generated with orders)
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
    },
  });
}

/**
 * Mutation hook to update an existing order.
 * Uses optimistic updates for instant UI feedback.
 * 
 * @returns Mutation result with mutate function
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, updates }: { orderId: string; updates: Partial<Order> }) =>
      orderAPI.update(orderId, updates),
    onMutate: async ({ orderId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.byId(orderId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.lists() });

      // Snapshot previous value for rollback
      const previousOrder = queryClient.getQueryData<Order>(queryKeys.orders.byId(orderId));
      const previousOrders = queryClient.getQueryData<Order[]>(queryKeys.orders.list());

      // Optimistically update the order detail
      if (previousOrder) {
        queryClient.setQueryData<Order>(
          queryKeys.orders.byId(orderId),
          { ...previousOrder, ...updates, updatedAt: new Date().toISOString() }
        );
      }

      // Optimistically update the orders list
      if (previousOrders) {
        queryClient.setQueryData<Order[]>(
          queryKeys.orders.list(),
          previousOrders.map(o =>
            o.orderId === orderId
              ? { ...o, ...updates, updatedAt: new Date().toISOString() }
              : o
          )
        );
      }

      return { previousOrder, previousOrders };
    },
    onError: (_, variables, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(
          queryKeys.orders.byId(variables.orderId),
          context.previousOrder
        );
      }
      if (context?.previousOrders) {
        queryClient.setQueryData(queryKeys.orders.list(), context.previousOrders);
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
}

/**
 * Mutation hook to delete an order.
 * 
 * @returns Mutation result with mutate function
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => orderAPI.delete(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Mutation hook to update test status within an order.
 * 
 * @returns Mutation result with mutate function
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
      orderId: string;
      testCode: string;
      status: TestStatus;
      additionalData?: Record<string, unknown>;
    }) => orderAPI.updateTestStatus(orderId, testCode, status, additionalData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
}

/**
 * Mutation hook to update payment status.
 * 
 * @returns Mutation result with mutate function
 */
export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      paymentStatus,
      amountPaid,
    }: {
      orderId: string;
      paymentStatus: string;
      amountPaid?: number;
    }) => orderAPI.updatePaymentStatus(orderId, paymentStatus, amountPaid),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });
}

/**
 * Mutation hook to mark a test as having critical values.
 * 
 * @returns Mutation result with mutate function
 */
export function useMarkTestCritical() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      testCode,
      notifiedTo,
    }: {
      orderId: string;
      testCode: string;
      notifiedTo: string;
    }) => orderAPI.markTestCritical(orderId, testCode, notifiedTo),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
}

/**
 * Hook to invalidate order caches.
 * 
 * @returns Object with invalidate functions
 */
export function useInvalidateOrders() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
  };

  const invalidateOrder = (orderId: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(orderId) });
  };

  return { invalidateAll, invalidateOrder };
}

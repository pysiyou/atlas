/**
 * Order Utility Hooks
 * Provides utility functions for order operations (search, lookup, cache invalidation)
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { queryKeys } from '@/lib/query';
import type { Order } from '@/types';
import { useOrdersList } from './useOrderQueries';

/**
 * Hook to search orders by order ID
 */
export function useOrderSearch(searchQuery: string) {
  const { orders, isLoading } = useOrdersList();

  const results = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter(order => order.orderId.toString().toLowerCase().includes(query));
  }, [orders, searchQuery]);

  return {
    results,
    isSearching: isLoading,
  };
}

/**
 * Hook to get order lookup function
 * Returns functions to resolve order IDs to orders
 */
export function useOrderLookup() {
  const { orders, isLoading } = useOrdersList();

  const ordersMap = useMemo(() => {
    const map = new Map<number, Order>();
    orders.forEach(o => map.set(o.orderId, o));
    return map;
  }, [orders]);

  const getOrder = useCallback(
    (orderId: number | string): Order | undefined => {
      const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      if (isNaN(numericId)) return undefined;
      return ordersMap.get(numericId);
    },
    [ordersMap]
  );

  return {
    getOrder,
    isLoading,
  };
}

/**
 * Hook to invalidate order caches
 * Provides functions to manually trigger cache refreshes
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

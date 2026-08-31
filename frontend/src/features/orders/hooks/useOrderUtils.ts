/**
 * Order Utility Hooks
 * Provides utility functions for order operations (search, lookup, cache invalidation)
 */

import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useEntityLookup, parseNumericKey } from '@/hooks/useEntityLookup';
import { queryKeys } from '@/lib/query';
import { useInvalidateQueryKey } from '@/lib/query/invalidate';
import { useOrdersList } from '@/features/orders/api/orders.api';

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
  const { get: getOrder } = useEntityLookup(orders, o => o.orderId, {
    isLoading,
    normalizeKey: parseNumericKey,
  });

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
  const { invalidateAll } = useInvalidateQueryKey(queryKeys.orders.all);

  const invalidateOrder = (orderId: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(orderId) });
  };

  return { invalidateAll, invalidateOrder };
}

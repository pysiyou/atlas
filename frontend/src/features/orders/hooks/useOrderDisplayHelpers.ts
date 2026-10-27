/**
 * Order Utility Hooks
 * Provides utility functions for order operations (search, lookup, cache invalidation)
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { parseNumericKey } from '@/hooks/useEntityLookup';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import { queryKeys, cacheConfig, useAuthQueryEnabled } from '@/lib/query';
import { useInvalidateQueryKey, invalidateOrderDetailQuery } from '@/lib/query/invalidate';
import { orderAPI } from '../api/orders';
import type { Order } from '@/types';

/**
 * Server-side order search (paginated, debounced).
 */
export function useOrderSearch(searchQuery: string) {
  const debounced = useDebouncedValue(searchQuery.trim(), 300);
  const enabled = useAuthQueryEnabled(debounced.length > 0);

  const query = useQuery({
    queryKey: queryKeys.orders.paginated({
      search: debounced,
      page: 1,
      pageSize: DEFAULT_LIST_PAGE_SIZE,
    }),
    queryFn: () =>
      orderAPI.getPaginated({
        search: debounced,
        page: 1,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
      }),
    enabled,
    ...cacheConfig.dynamic,
  });

  return {
    results: debounced.length > 0 ? (query.data?.data ?? []) : [],
    isSearching: query.isLoading,
  };
}

/**
 * Resolves orders from the query cache (detail queries) by id.
 */
export function useOrderLookup() {
  const queryClient = useQueryClient();

  const getOrder = (orderId: number | string): Order | undefined => {
    const key = parseNumericKey(orderId);
    if (key == null) return undefined;
    return queryClient.getQueryData<Order>(queryKeys.orders.byId(String(key)));
  };

  return {
    getOrder,
    isLoading: false,
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
    return invalidateOrderDetailQuery(queryClient, orderId);
  };

  return { invalidateAll, invalidateOrder };
}

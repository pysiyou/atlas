/**
 * useTimelineQuery - Paginated timeline data for the command center.
 */

import { useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { monitoringAPI } from '../api/monitoring.api';

const MAX_ACCUMULATED = 200;

export function useTimelineQuery(hoursBack = 24, limit = 50) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.monitoring.timeline({ hoursBack, limit }),
    queryFn: ({ pageParam }) =>
      monitoringAPI.getTimeline({ hoursBack, limit, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.events) return undefined;
      const loaded = allPages.reduce((sum, page) => sum + (page?.events?.length ?? 0), 0);
      if (loaded >= lastPage.total || loaded >= MAX_ACCUMULATED) return undefined;
      return loaded;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const events = query.data?.pages.flatMap(page => page?.events ?? []) ?? [];
  const hasMore = Boolean(query.hasNextPage) && events.length < MAX_ACCUMULATED;

  const refetchTimeline = useCallback(() => {
    void query.refetch();
  }, [query]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  return {
    events,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    isError: query.isError,
    refetchTimeline,
    loadMore,
    hasMore,
  };
}

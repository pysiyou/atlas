/**
 * Paginated activity feed query for the command center.
 */

import { useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { LAB_CONFIG } from '@/features/lab/constants';
import { commandCenterAPI } from '../api/commandCenter.api';

const MAX_ACCUMULATED = 200;

export function useActivityFeedQuery(hoursBack = 24, limit = 50) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.commandCenter.timeline({ hours_back: hoursBack, limit }),
    queryFn: ({ pageParam }) =>
      commandCenterAPI.getTimeline({ hours_back: hoursBack, limit, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.events) return undefined;
      const loaded = allPages.reduce((sum, page) => sum + (page?.events?.length ?? 0), 0);
      if (loaded >= lastPage.total || loaded >= MAX_ACCUMULATED) return undefined;
      return loaded;
    },
    staleTime: LAB_CONFIG.COMMAND_CENTER_STALE_MS,
    refetchInterval: LAB_CONFIG.COMMAND_CENTER_REFETCH_MS,
  });

  const events = query.data?.pages.flatMap(page => page?.events ?? []) ?? [];
  const hasMore = Boolean(query.hasNextPage) && events.length < MAX_ACCUMULATED;

  const refetchFeed = useCallback(() => {
    void query.refetch();
  }, [query.refetch]);

  /** Fetch the next page; returns how many raw events were added and whether more pages exist. */
  const loadMore = useCallback(async (): Promise<{ added: number; hasMore: boolean }> => {
    if (!query.hasNextPage || query.isFetchingNextPage) {
      return { added: 0, hasMore: Boolean(query.hasNextPage) };
    }

    const before = query.data?.pages.flatMap(page => page?.events ?? []).length ?? 0;
    const result = await query.fetchNextPage();
    const after = result.data?.pages.flatMap(page => page?.events ?? []).length ?? before;
    return { added: after - before, hasMore: Boolean(result.hasNextPage) };
  }, [query.data?.pages, query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage]);

  return {
    events,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    isError: query.isError,
    refetchFeed,
    loadMore,
    hasMore,
  };
}

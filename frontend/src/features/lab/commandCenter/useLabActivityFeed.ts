/**
 * Paginated activity feed query for the command center.
 */
import { useCallback, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { LAB_CONFIG } from '@/features/lab/constants';
import { labCommandCenterAPI } from '../api/labCommandCenter';
import { timelineLaneToApiCategory } from '../constants/labConstants';
import type { LabTimelineLane } from '../constants/labConstants';

const MAX_ACCUMULATED = 200;

export function useLabActivityFeedQuery(
  hoursBack = 24,
  limit = 50,
  categories?: string[],
) {
  const categoryKey = categories?.slice().sort().join(',') || undefined;
  const query = useInfiniteQuery({
    queryKey: queryKeys.commandCenter.timeline({
      hours_back: hoursBack,
      limit,
      categories: categoryKey,
    }),
    queryFn: ({ pageParam }) =>
      labCommandCenterAPI.getTimeline({
        hours_back: hoursBack,
        limit,
        offset: pageParam,
        categories,
      }),
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
  }, [query]);

  /** Fetch the next page; returns how many raw events were added and whether more pages exist. */
  const loadMore = useCallback(async (): Promise<{ added: number; hasMore: boolean }> => {
    if (!query.hasNextPage || query.isFetchingNextPage) {
      return { added: 0, hasMore: Boolean(query.hasNextPage) };
    }

    const before = query.data?.pages.flatMap(page => page?.events ?? []).length ?? 0;
    const result = await query.fetchNextPage();
    const after = result.data?.pages.flatMap(page => page?.events ?? []).length ?? before;
    return { added: after - before, hasMore: Boolean(result.hasNextPage) };
  }, [query]);

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

const TECH_FEED_HOURS = 24;
const TECH_FEED_PAGE_SIZE = 50;
const TECH_FEED_VISIBLE_STEP = 30;
const TECH_FEED_MAX_VISIBLE = 200;

/** Lab workflow + order-coordination events (status, payments, test changes, recollection). */
const TECH_LANES: LabTimelineLane[] = ['sample', 'results', 'validation', 'order'];
const TECH_CATEGORIES = TECH_LANES.map(timelineLaneToApiCategory);

export function useRecentLabActivityFeed() {
  const query = useLabActivityFeedQuery(TECH_FEED_HOURS, TECH_FEED_PAGE_SIZE, [...TECH_CATEGORIES]);
  const [visibleLimit, setVisibleLimit] = useState(TECH_FEED_VISIBLE_STEP);

  const events = query.events.slice(0, visibleLimit);

  const canRevealBuffered =
    query.events.length > visibleLimit && visibleLimit < TECH_FEED_MAX_VISIBLE;
  const needsRemotePage =
    query.hasMore && visibleLimit >= query.events.length && visibleLimit < TECH_FEED_MAX_VISIBLE;
  const hasMore = canRevealBuffered || needsRemotePage;

  const loadMore = useCallback(async () => {
    if (query.events.length > visibleLimit) {
      setVisibleLimit(limit =>
        Math.min(limit + TECH_FEED_VISIBLE_STEP, TECH_FEED_MAX_VISIBLE, query.events.length),
      );
      return;
    }

    if (!query.hasMore || visibleLimit >= TECH_FEED_MAX_VISIBLE) return;

    setVisibleLimit(limit => Math.min(limit + TECH_FEED_VISIBLE_STEP, TECH_FEED_MAX_VISIBLE));
    await query.loadMore();
  }, [query, visibleLimit]);

  return {
    events,
    isLoading: query.isLoading,
    isLoadingMore: query.isLoadingMore,
    isError: query.isError,
    refetchFeed: query.refetchFeed,
    hasMore,
    loadMore,
  };
}

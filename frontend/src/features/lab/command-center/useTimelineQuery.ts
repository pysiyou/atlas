/**
 * useTimelineQuery - React Query hook for command center timeline.
 */

import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { monitoringAPI, type TimelineEvent } from '../api/monitoring.api';

const MAX_ACCUMULATED = 200;

export function useTimelineQuery(hoursBack: number = 24, limit: number = 50) {
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<TimelineEvent[]>([]);

  const query = useQuery({
    queryKey: ['timeline', { hoursBack, limit, offset }],
    queryFn: () => monitoringAPI.getTimeline({ hoursBack, limit, offset }),
    staleTime: 30_000,
    refetchInterval: offset === 0 ? 60_000 : false,
  });

  useEffect(() => {
    if (!query.isSuccess || !query.data) return;
    const page = query.data.events;
    if (offset === 0) {
      setAccumulated(page);
    } else {
      setAccumulated(prev => [...prev, ...page]);
    }
  }, [offset, query.isSuccess, query.dataUpdatedAt, query.data]);

  const refetchTimeline = useCallback(() => {
    setOffset(0);
    setAccumulated([]);
    query.refetch();
  }, [query]);

  const loadMore = useCallback(() => {
    setOffset(prev => prev + limit);
  }, [limit]);

  const total = query.data?.total ?? 0;
  const hasMore = accumulated.length < total && accumulated.length < MAX_ACCUMULATED;

  return {
    events: accumulated,
    isLoading: query.isLoading && offset === 0,
    isLoadingMore: offset > 0 && query.isFetching,
    isError: query.isError,
    refetchTimeline,
    loadMore,
    hasMore,
  };
}

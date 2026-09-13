/**
 * Fixed-window activity feed for the lab tech command center.
 */

import { useCallback, useMemo, useState } from 'react';
import { useActivityFeedQuery } from './useActivityFeedQuery';
import { getEventCategory, type TimelineEventCategory } from '@/features/lab/timeline/activityCategories';
import type { TimelineEvent } from '../api/commandCenter.api';

const TECH_FEED_HOURS = 24;
const TECH_FEED_PAGE_SIZE = 50;
const TECH_FEED_VISIBLE_STEP = 30;
const TECH_FEED_MAX_VISIBLE = 200;
const MAX_EMPTY_PAGE_FETCHES = 3;

/** Lab workflow + order-coordination events (status, payments, test changes, recollection). */
const TECH_CATEGORIES = new Set<TimelineEventCategory>([
  'specimen',
  'results',
  'validation',
  'order',
]);

function filterTechEvents(events: TimelineEvent[]): TimelineEvent[] {
  return events.filter(event => TECH_CATEGORIES.has(getEventCategory(event.type)));
}

export function useRecentActivityFeed() {
  const query = useActivityFeedQuery(TECH_FEED_HOURS, TECH_FEED_PAGE_SIZE);
  const [visibleLimit, setVisibleLimit] = useState(TECH_FEED_VISIBLE_STEP);

  const filtered = useMemo(() => filterTechEvents(query.events), [query.events]);
  const events = filtered.slice(0, visibleLimit);

  const canRevealBuffered =
    filtered.length > visibleLimit && visibleLimit < TECH_FEED_MAX_VISIBLE;
  const needsRemotePage =
    query.hasMore && visibleLimit >= filtered.length && visibleLimit < TECH_FEED_MAX_VISIBLE;
  const hasMore = canRevealBuffered || needsRemotePage;

  const loadMore = useCallback(async () => {
    if (filtered.length > visibleLimit) {
      setVisibleLimit(limit =>
        Math.min(limit + TECH_FEED_VISIBLE_STEP, TECH_FEED_MAX_VISIBLE, filtered.length),
      );
      return;
    }

    if (!query.hasMore || visibleLimit >= TECH_FEED_MAX_VISIBLE) return;

    setVisibleLimit(limit => Math.min(limit + TECH_FEED_VISIBLE_STEP, TECH_FEED_MAX_VISIBLE));

    let hasNext: boolean = query.hasMore;
    let emptyFetches = 0;
    while (hasNext && emptyFetches < MAX_EMPTY_PAGE_FETCHES) {
      const { added, hasMore: nextPage } = await query.loadMore();
      if (added > 0) break;
      hasNext = nextPage;
      emptyFetches += 1;
    }
  }, [filtered.length, query, visibleLimit]);

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

/**
 * Fixed-window activity feed for the lab tech command center.
 */

import { useCallback, useState } from 'react';
import { timelineLaneToApiCategory } from '../constants/labWorkflowVisual';
import type { LabTimelineLane } from '../constants/labCopy';
import { useActivityFeedQuery } from './useActivityFeedQuery';

const TECH_FEED_HOURS = 24;
const TECH_FEED_PAGE_SIZE = 50;
const TECH_FEED_VISIBLE_STEP = 30;
const TECH_FEED_MAX_VISIBLE = 200;

/** Lab workflow + order-coordination events (status, payments, test changes, recollection). */
const TECH_LANES: LabTimelineLane[] = ['sample', 'results', 'validation', 'order'];
const TECH_CATEGORIES = TECH_LANES.map(timelineLaneToApiCategory);

export function useRecentActivityFeed() {
  const query = useActivityFeedQuery(TECH_FEED_HOURS, TECH_FEED_PAGE_SIZE, [...TECH_CATEGORIES]);
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

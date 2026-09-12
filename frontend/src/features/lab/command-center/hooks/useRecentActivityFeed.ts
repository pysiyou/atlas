/**
 * Fixed-window activity feed for the lab tech command center.
 */

import { useMemo } from 'react';
import { useActivityFeedQuery } from '../useActivityFeedQuery';
import { getEventCategory, type TimelineEventCategory } from '../activityCategories';
import type { TimelineEvent } from '../../api/commandCenter.api';

const TECH_FEED_HOURS = 24;
const TECH_FEED_LIMIT = 50;
const TECH_FEED_MAX_EVENTS = 30;

const TECH_CATEGORIES = new Set<TimelineEventCategory>(['specimen', 'results', 'validation']);

function filterTechEvents(events: TimelineEvent[]): TimelineEvent[] {
  return events
    .filter(event => TECH_CATEGORIES.has(getEventCategory(event.type)))
    .slice(0, TECH_FEED_MAX_EVENTS);
}

export function useRecentActivityFeed() {
  const query = useActivityFeedQuery(TECH_FEED_HOURS, TECH_FEED_LIMIT);

  const events = useMemo(
    () => filterTechEvents(query.events),
    [query.events],
  );

  return {
    events,
    isLoading: query.isLoading,
    isError: query.isError,
    refetchFeed: query.refetchFeed,
  };
}

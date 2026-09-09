/**
 * ActivityTimeline - Lab command center activity feed.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components';
import { Skeleton } from '@/components/loaders/Skeleton';
import { cn, formatRelativeDateLabel, formatRelativeDateTime } from '@/utils';
import { ENTITY_ID, ENTITY_ID_CLICKABLE } from '@/utils/constants';
import type { TimelineEvent } from '../api/monitoring.api';
import {
  formatTimelineEvent,
  type EventDetail,
} from './formatTimelineEvent';
import { COMMAND_CENTER_TIMELINE } from './commandCenterStyles';
import {
  getCategoryConfig,
  getEventCategory,
  getEventTone,
} from './timelineCategories';

export interface ActivityTimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

function TimelineSkeleton() {
  return (
    <div className="flex flex-col h-full bg-surface" aria-busy="true">
      <div className="flex-1 overflow-auto px-4 py-2 space-y-4">
        {Array.from({ length: 2 }).map((_, g) => (
          <div key={g} className="space-y-3">
            <Skeleton height={10} width={48} className="mx-auto" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton circle width={8} height={8} className="mt-1 shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton height={14} width="70%" />
                  <Skeleton height={12} width="85%" />
                  <Skeleton height={10} width="50%" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineDetail({ detail }: { detail: EventDetail }) {
  switch (detail.type) {
    case 'note':
      return <span className="text-xs text-text-secondary">Notes: {detail.value}</span>;
    case 'status':
    case 'sampleType':
      return <Badge variant={detail.value} size="xs" />;
    case 'testCode':
    case 'id':
      return <span className={ENTITY_ID}>{detail.value}</span>;
    case 'link':
      return (
        <Link to={detail.to} className={ENTITY_ID_CLICKABLE}>
          {detail.value}
        </Link>
      );
    default:
      return <span className="text-xs text-text-secondary">{detail.value}</span>;
  }
}

function TimelineEventRow({ event }: { event: TimelineEvent }) {
  const category = getEventCategory(event.type);
  const categoryConfig = getCategoryConfig(category);
  const tone = getEventTone(event);
  const formatted = formatTimelineEvent(event);

  return (
    <li className={COMMAND_CENTER_TIMELINE.eventRow}>
      <div
        className={cn(COMMAND_CENTER_TIMELINE.eventDot, COMMAND_CENTER_TIMELINE.toneDot[tone])}
        aria-hidden="true"
      />
      <div className={COMMAND_CENTER_TIMELINE.eventBody}>
        <div className={COMMAND_CENTER_TIMELINE.eventTitleRow}>
          <span className={cn(COMMAND_CENTER_TIMELINE.categoryPill, categoryConfig.pillClass)}>
            {categoryConfig.label}
          </span>
          <span className={COMMAND_CENTER_TIMELINE.eventAction}>{formatted.action}</span>
        </div>
        {formatted.details.length > 0 && (
          <div className={COMMAND_CENTER_TIMELINE.eventDetails}>
            {formatted.details.map((detail, idx) => (
              <TimelineDetail key={idx} detail={detail} />
            ))}
          </div>
        )}
        {formatted.note && (
          <p className="text-xs text-text-tertiary mt-0.5">Notes: {formatted.note}</p>
        )}
        <p className={COMMAND_CENTER_TIMELINE.eventMeta}>
          {event.performedByName || `User ${event.performedBy}`}
          {' · '}
          <time dateTime={event.timestamp}>
            {formatRelativeDateTime(new Date(event.timestamp))}
          </time>
        </p>
      </div>
    </li>
  );
}

function TimelineGroup({ label, items }: { label: string; items: TimelineEvent[] }) {
  return (
    <section className="px-4 pb-4 first:pt-1">
      <div className={COMMAND_CENTER_TIMELINE.groupHeader}>
        <div className={COMMAND_CENTER_TIMELINE.groupDivider} />
        <span className={COMMAND_CENTER_TIMELINE.groupLabel}>{label}</span>
        <div className={COMMAND_CENTER_TIMELINE.groupDivider} />
      </div>
      <ul className="space-y-0 list-none relative">
        <div className={COMMAND_CENTER_TIMELINE.connector} aria-hidden="true" />
        {items.map(event => (
          <TimelineEventRow key={event.id} event={event} />
        ))}
      </ul>
    </section>
  );
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  events,
  isLoading = false,
  isError = false,
  onRetry,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}) => {
  const groups = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const event of events) {
      const label = formatRelativeDateLabel(new Date(event.timestamp));
      const bucket = map.get(label) ?? [];
      bucket.push(event);
      map.set(label, bucket);
    }
    return Array.from(map.entries()).map(([label, items]) => ({
      label,
      items: items.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    }));
  }, [events]);

  if (isError) {
    return (
      <div className="flex flex-col h-full bg-surface items-center justify-center gap-2 px-4">
        <p className="text-sm text-text-secondary">Couldn't load timeline</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className={COMMAND_CENTER_TIMELINE.retryLink}>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isLoading) return <TimelineSkeleton />;

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface">
        <p className="text-sm text-text-secondary">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-1 overflow-auto min-h-0">
        {groups.map(group => (
          <TimelineGroup key={group.label} label={group.label} items={group.items} />
        ))}
        {hasMore && onLoadMore && (
          <div className={COMMAND_CENTER_TIMELINE.loadMore}>
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className={COMMAND_CENTER_TIMELINE.retryLinkDisabled}
            >
              {isLoadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

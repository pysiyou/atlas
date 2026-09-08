/**
 * ActivityTimeline - Lab command center activity feed.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components';
import { Skeleton } from '@/components/loaders/Skeleton';
import { formatRelativeDateLabel, formatRelativeDateTime } from '@/utils';
import { ENTITY_ID, ENTITY_ID_CLICKABLE } from '@/utils/constants';
import type { TimelineEvent } from '../api/monitoring.api';
import {
  formatTimelineEvent,
  type EventDetail,
} from './formatTimelineEvent';

const TONE_DOT_CLASS = {
  problem: 'bg-danger-fg-emphasis',
  resolution: 'bg-success-fg-emphasis',
  neutral: 'bg-brand',
} as const;

const PROBLEM_TYPES = new Set([
  'sample_reject',
  'quality_issue_reported',
  'critical_value_detected',
  'critical_value_notified',
  'escalation_trigger_crit_val',
  'escalation_trigger_rej_samp',
  'escalation_trigger_limit_hit',
  'escalation_trigger_amend_res',
  'recollection_request_denied',
  'test_removed',
  'escalation_resolution_cancel_test',
  'sample_recollection_request',
  'recollection_request_created',
]);

function getEventTone(event: TimelineEvent): keyof typeof TONE_DOT_CLASS {
  const { type } = event;
  if (PROBLEM_TYPES.has(type) || type.includes('reject') || type.startsWith('escalation_trigger_')) {
    return 'problem';
  }
  if (
    type === 'result_validation_approve' ||
    type === 'critical_value_acknowledged' ||
    type === 'recollection_request_approved' ||
    type.startsWith('escalation_resolution_')
  ) {
    return 'resolution';
  }
  return 'neutral';
}

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
                <Skeleton circle width={8} height={8} className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Skeleton height={14} width="85%" />
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
      return <span className="text-sm text-text-secondary">Notes: {detail.value}</span>;
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
      return <span className="text-sm text-text-secondary">{detail.value}</span>;
  }
}

function TimelineEventRow({ event }: { event: TimelineEvent }) {
  const tone = getEventTone(event);
  const formatted = formatTimelineEvent(event);

  return (
    <li className="flex items-start gap-2.5 relative">
      <div
        className={`w-2 h-2 rounded-full border-2 border-surface shrink-0 mt-1.5 z-10 ${TONE_DOT_CLASS[tone]}`}
      />
      <div className="flex-1 min-w-0 pb-3">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-sm font-light text-text-primary">{formatted.action}</span>
          {formatted.details.map((detail, idx) => (
            <TimelineDetail key={idx} detail={detail} />
          ))}
        </div>
        {formatted.note && (
          <p className="text-xs text-text-tertiary mt-0.5">Notes: {formatted.note}</p>
        )}
        <p className="text-xs text-text-tertiary mt-1">
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
      <div className="flex items-center gap-2 py-2 sticky top-0 z-1 bg-surface/95">
        <div className="flex-1 h-px bg-stroke/80" />
        <span className="text-xxs font-light text-text-tertiary uppercase tracking-widest">
          {label}
        </span>
        <div className="flex-1 h-px bg-stroke/80" />
      </div>
      <ul className="space-y-0 list-none relative">
        <div
          className="absolute top-2 bottom-2 w-px bg-stroke/60 pointer-events-none left-[3px]"
          aria-hidden="true"
        />
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
          <button type="button" onClick={onRetry} className="text-sm text-brand hover:underline">
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
          <div className="px-4 py-2 flex justify-center border-t border-stroke/80">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="text-sm text-brand hover:underline disabled:opacity-60"
            >
              {isLoadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

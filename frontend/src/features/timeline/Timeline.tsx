/**
 * Unified audit timeline — lab history, command center feed, and order detail.
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EntityId } from '@/components';
import { cn, formatRelativeDateLabel, formatRelativeDateTime } from '@/utils';
import type { TimelineEvent } from '@/features/lab/api/labCommandCenter';
import { useOpenHistoricalLabRecord } from '@/features/lab/hooks/useOpenHistoricalLabRecord';
import {
  categoriesForPreset,
  filterEventsByCategories,
  resolveCategory,
  type TimelineCategory,
} from './timelineCategories';
import { formatTimelineEvent } from './timelineEventRegistry';
import type { EventDetail } from './timelineEventRegistry';
import { formatStatusLabel } from './timelineDetails';
import { getRetestAttemptDivider } from './timelineRetestDivider';
import { TIMELINE_STYLES } from './timelineStyles';
import { getCategoryVisual } from './timelineVisuals';

export type TimelinePreset = 'lab' | 'order' | 'commandCenter' | 'all';

export interface TimelineProps {
  events: TimelineEvent[];
  preset?: TimelinePreset;
  categoryFilter?: TimelineCategory[];
  interactiveEntities?: boolean;
  showRetestDividers?: boolean;
  emptyMessage?: string;
  className?: string;
  footer?: React.ReactNode;
}

function TimelineDetail({
  detail,
  interactiveEntities,
  onOpenSample,
  onOpenOrderTest,
}: {
  detail: EventDetail;
  interactiveEntities: boolean;
  onOpenSample: (id: number) => void;
  onOpenOrderTest: (id: number) => void;
}) {
  switch (detail.type) {
    case 'note':
      return (
        <span className={TIMELINE_STYLES.eventDetailText}>Notes: {detail.value}</span>
      );
    case 'status':
      return (
        <span className={TIMELINE_STYLES.eventDetailText}>{formatStatusLabel(detail.value)}</span>
      );
    case 'sampleType':
      return <span className={TIMELINE_STYLES.eventDetailText}>{detail.value}</span>;
    case 'testCode':
    case 'id':
      return <EntityId variant="inline">{detail.value}</EntityId>;
    case 'link':
      return (
        <EntityId variant="clickable" as={Link} to={detail.to}>
          {detail.value}
        </EntityId>
      );
    case 'entityRef':
      if (!interactiveEntities) {
        return <EntityId variant="inline">{detail.value}</EntityId>;
      }
      return (
        <EntityId
          variant="clickable"
          as="button"
          className="text-left"
          onClick={e => {
            e.stopPropagation();
            if (detail.entityType === 'sample') onOpenSample(detail.entityId);
            else onOpenOrderTest(detail.entityId);
          }}
        >
          {detail.value}
        </EntityId>
      );
    default:
      return <span className={TIMELINE_STYLES.eventDetailText}>{detail.value}</span>;
  }
}

function TimelineEventRow({
  event,
  isLast,
  interactiveEntities,
  onOpenSample,
  onOpenOrderTest,
}: {
  event: TimelineEvent;
  isLast: boolean;
  interactiveEntities: boolean;
  onOpenSample: (id: number) => void;
  onOpenOrderTest: (id: number) => void;
}) {
  const category = resolveCategory(event);
  const visual = getCategoryVisual(category);
  const formatted = formatTimelineEvent(event);

  const performerLabel =
    event.performedByName ??
    (event.performedBy === 'system' ? 'System' : `User ${event.performedBy}`);

  return (
    <li className={TIMELINE_STYLES.eventRow}>
      <div className={TIMELINE_STYLES.eventDotTrack}>
        <div
          className={cn(TIMELINE_STYLES.eventDot, visual.dotClass)}
          aria-hidden="true"
        />
        {!isLast && (
          <div
            className={cn(
              TIMELINE_STYLES.eventConnectorStem,
              TIMELINE_STYLES.connectorStem,
            )}
            aria-hidden="true"
          />
        )}
      </div>
      <div className={TIMELINE_STYLES.eventBody}>
        <div className={TIMELINE_STYLES.eventHeadline}>{formatted.action}</div>
        {formatted.details.length > 0 && (
          <div className={TIMELINE_STYLES.eventDetails}>
            {formatted.details.map((detail, idx) => (
              <TimelineDetail
                key={`${event.id}-${idx}`}
                detail={detail}
                interactiveEntities={interactiveEntities}
                onOpenSample={onOpenSample}
                onOpenOrderTest={onOpenOrderTest}
              />
            ))}
          </div>
        )}
        {formatted.note && (
          <p className={cn(TIMELINE_STYLES.eventDetailText, 'whitespace-pre-wrap')}>
            Notes: {formatted.note}
          </p>
        )}
        <p className={TIMELINE_STYLES.eventMeta}>
          {performerLabel} ·{' '}
          <time dateTime={event.timestamp} title={formatRelativeDateTime(event.timestamp)}>
            {formatRelativeDateTime(event.timestamp)}
          </time>
        </p>
      </div>
    </li>
  );
}

type TimelineGroupItem =
  | { kind: 'divider'; testId: number }
  | { kind: 'event'; event: TimelineEvent };

function isLastEventInGroup(items: TimelineGroupItem[], index: number): boolean {
  for (let i = index + 1; i < items.length; i++) {
    if (items[i].kind === 'event') return false;
  }
  return true;
}

export const Timeline: React.FC<TimelineProps> = ({
  events,
  preset = 'all',
  categoryFilter,
  interactiveEntities = false,
  showRetestDividers,
  emptyMessage = 'No recorded actions yet.',
  className,
  footer,
}) => {
  const { openSample, openOrderTest } = useOpenHistoricalLabRecord();
  const retestDividers = showRetestDividers ?? preset === 'lab';

  const visibleEvents = useMemo(() => {
    const allowed = categoryFilter ?? categoriesForPreset(preset);
    return filterEventsByCategories(events, allowed);
  }, [events, categoryFilter, preset]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: TimelineGroupItem[] }[] = [];
    let currentLabel: string | null = null;
    let previousEvent: TimelineEvent | undefined;

    for (const event of visibleEvents) {
      const label = formatRelativeDateLabel(event.timestamp);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [] });
      }
      const group = groups[groups.length - 1];

      if (retestDividers) {
        const divider = getRetestAttemptDivider(event, previousEvent);
        if (divider) {
          group.items.push({ kind: 'divider', testId: divider.testId });
        }
      }

      group.items.push({ kind: 'event', event });
      previousEvent = event;
    }
    return groups;
  }, [visibleEvents, retestDividers]);

  if (visibleEvents.length === 0) {
    return <p className="text-sm text-text-tertiary">{emptyMessage}</p>;
  }

  return (
    <div className={cn('overflow-y-auto pr-space-1', className ?? 'max-h-80')}>
      {grouped.map(group => (
        <div key={group.label} className="mb-space-2">
          <div className={TIMELINE_STYLES.groupHeader}>
            <span className={TIMELINE_STYLES.groupLabel}>{group.label}</span>
            <div className={TIMELINE_STYLES.groupDivider} />
          </div>
          <ul className="space-y-0">
            {group.items.map((item, idx) => {
              if (item.kind === 'divider') {
                return (
                  <li key={`divider-${group.label}-${idx}`} className="pb-space-2 pl-space-5">
                    <span className={TIMELINE_STYLES.eventDetailText}>Retest attempt · </span>
                    <EntityId type="orderTest" value={item.testId} variant="inline" />
                  </li>
                );
              }
              const isLast = isLastEventInGroup(group.items, idx);
              return (
                <TimelineEventRow
                  key={item.event.id}
                  event={item.event}
                  isLast={isLast}
                  interactiveEntities={interactiveEntities}
                  onOpenSample={openSample}
                  onOpenOrderTest={openOrderTest}
                />
              );
            })}
          </ul>
        </div>
      ))}
      {footer}
    </div>
  );
};

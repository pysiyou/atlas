/**
 * Unified activity feed — social-style audit history for lab dashboard, orders, and entity panels.
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, EMPTY_COPY, EntityId, DASHBOARD_EMPTY_STATE, DASHBOARD_EMPTY_STATE_TEXT, MODAL_EMPTY_STATE, PANEL_EMPTY_STATE } from '@/components';
import { cn, formatRelativeDateLabel, formatRelativeDateTime } from '@/utils';
import type { TimelineEvent } from '@/features/lab';
import { useOpenHistoricalLabRecord } from '@/features/lab';
import {
  categoriesForPreset,
  filterEventsByCategories,
  resolveCategory,
  resolveFeedKind,
  type TimelineCategory,
} from './timelineCategories';
import { formatTimelineEvent } from './timelineEventRegistry';
import type { EventDetail } from './timelineEventRegistry';
import { formatStatusLabel } from './timelineDetails';
import { getRetestAttemptDivider } from './timelineRetestDivider';
import { TIMELINE_STYLES } from './timelineStyles';
import { formatPerformerName, getFeedKindMeta } from './timelineFeedCopy';
import { getCategoryVisual } from './timelineVisuals';

export type TimelinePreset = 'lab' | 'order' | 'commandCenter' | 'all';

export interface TimelineProps {
  events: TimelineEvent[];
  preset?: TimelinePreset;
  categoryFilter?: TimelineCategory[];
  interactiveEntities?: boolean;
  showRetestDividers?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  /** Tables use icon + copy; panels/modals use title + description only. */
  emptyVisual?: 'withIcon' | 'textOnly';
  emptyVariant?: 'compact' | 'dense';
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

function TimelinePost({
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
  const feedKind = resolveFeedKind(event);
  const category = getFeedKindMeta(feedKind);
  const visual = getCategoryVisual(resolveCategory(event));
  const formatted = formatTimelineEvent(event);
  const actor = formatPerformerName(event.performedByName, event.performedBy);
  const relativeTime = formatRelativeDateTime(event.timestamp);

  return (
    <li className={TIMELINE_STYLES.eventRow}>
      <div className={TIMELINE_STYLES.eventDotTrack}>
        <div className={cn(TIMELINE_STYLES.eventDot, visual.dotClass)} aria-hidden="true" />
        {!isLast && (
          <div
            className={cn(TIMELINE_STYLES.eventConnectorStem, TIMELINE_STYLES.connectorStem)}
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
                key={`${event.id}-d-${idx}`}
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
          {actor} ·{' '}
          <time dateTime={event.timestamp} title={relativeTime}>
            {relativeTime}
          </time>
          {' · '}
          {category.tag}
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
    if (items[i]!.kind === 'event') return false;
  }
  return true;
}

export const Timeline: React.FC<TimelineProps> = ({
  events,
  preset = 'all',
  categoryFilter,
  interactiveEntities = false,
  showRetestDividers,
  emptyMessage = EMPTY_COPY.recordedActions.title,
  emptyDescription = EMPTY_COPY.recordedActions.description,
  emptyVisual = 'withIcon',
  emptyVariant = 'compact',
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
      const group = groups[groups.length - 1]!;

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
    const emptyPreset =
      emptyVariant === 'dense'
        ? emptyVisual === 'textOnly'
          ? DASHBOARD_EMPTY_STATE_TEXT
          : DASHBOARD_EMPTY_STATE
        : emptyVisual === 'textOnly'
          ? MODAL_EMPTY_STATE
          : PANEL_EMPTY_STATE;
    return (
      <div className={cn('flex min-h-0 flex-col bg-transparent', className ?? 'max-h-80')}>
        <EmptyState
          {...emptyPreset}
          title={emptyMessage}
          description={emptyDescription}
        />
        {footer}
      </div>
    );
  }

  return (
    <div className={cn(TIMELINE_STYLES.scroll, className ?? 'max-h-80')}>
      {grouped.map(group => (
        <section key={group.label} className="mb-space-2">
          <div className={TIMELINE_STYLES.groupHeader}>
            <div className={TIMELINE_STYLES.groupDivider} />
            <span className={TIMELINE_STYLES.groupLabel}>{group.label}</span>
            <div className={TIMELINE_STYLES.groupDivider} />
          </div>
          <ul className={TIMELINE_STYLES.postList}>
            {group.items.map((item, idx) => {
              if (item.kind === 'divider') {
                return (
                  <li
                    key={`divider-${group.label}-${idx}`}
                    className={TIMELINE_STYLES.threadMarker}
                  >
                    Retest attempt ·{' '}
                    <EntityId type="orderTest" value={item.testId} variant="inline" />
                  </li>
                );
              }
              const isLast = isLastEventInGroup(group.items, idx);
              return (
                <TimelinePost
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
        </section>
      ))}
      {footer}
    </div>
  );
};

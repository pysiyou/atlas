/**
 * LabAuditTimeline — shared vertical timeline for entity history panels and command center.
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge, EntityId } from '@/components';
import { cn, formatRelativeDateLabel, formatRelativeDateTime } from '@/utils';
import type { TimelineEvent } from '../api/labCommandCenter.api';
import {
  getCategoryConfig,
  getEventCategory,
  getEventTone,
} from '../timeline/activityCategories';
import { formatActivityEvent } from '../timeline/formatActivityEvent';
import { COMMAND_CENTER_TIMELINE } from '../timeline/timelineStyles';
import { useOpenHistoricalLabRecord } from '../hooks/useOpenHistoricalLabRecord';
import {
  getEntityCategoryConfig,
  getEntityEventCategory,
  getEntityEventTone,
} from '../timeline/entityTimelineCategories';
import {
  formatEntityTimelineEvent,
  getRetestAttemptDivider,
} from '../timeline/formatEntityTimelineEvent';
import type { EventDetail as EntityEventDetail } from '../timeline/timelineDetailBuilders';
import type { EventDetail as FeedEventDetail } from '../timeline/formatActivityEvent';

type TimelineDetailItem = EntityEventDetail | FeedEventDetail;

export interface LabAuditTimelineProps {
  events: TimelineEvent[];
  /** Entity history panels use workflow-phase categories; command center includes order events. */
  variant?: 'entity' | 'commandCenter';
  interactiveEntities?: boolean;
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
  detail: TimelineDetailItem;
  interactiveEntities: boolean;
  onOpenSample: (id: number) => void;
  onOpenOrderTest: (id: number) => void;
}) {
  switch (detail.type) {
    case 'note':
      return (
        <span className={COMMAND_CENTER_TIMELINE.eventDetailText}>Notes: {detail.value}</span>
      );
    case 'status':
    case 'sampleType':
      return <Badge variant={detail.value} size="xs" />;
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
      return <span className={COMMAND_CENTER_TIMELINE.eventDetailText}>{detail.value}</span>;
  }
}

function TimelineEventRow({
  event,
  isLast,
  variant,
  interactiveEntities,
  onOpenSample,
  onOpenOrderTest,
}: {
  event: TimelineEvent;
  isLast: boolean;
  variant: 'entity' | 'commandCenter';
  interactiveEntities: boolean;
  onOpenSample: (id: number) => void;
  onOpenOrderTest: (id: number) => void;
}) {
  const isEntity = variant === 'entity';
  const categoryConfig = isEntity
    ? getEntityCategoryConfig(getEntityEventCategory(event))
    : getCategoryConfig(getEventCategory(event.type));
  const tone = isEntity ? getEntityEventTone(event) : getEventTone(event);
  const formatted = isEntity
    ? formatEntityTimelineEvent(event)
    : formatActivityEvent(event, { interactiveEntities });

  const performerLabel =
    event.performedByName ??
    (event.performedBy === 'system' ? 'System' : `User ${event.performedBy}`);

  return (
    <li className={COMMAND_CENTER_TIMELINE.eventRow}>
      <div className={COMMAND_CENTER_TIMELINE.eventDotTrack}>
        <div
          className={cn(COMMAND_CENTER_TIMELINE.eventDot, COMMAND_CENTER_TIMELINE.toneDot[tone])}
          aria-hidden="true"
        />
        {!isLast && (
          <div
            className={cn(
              COMMAND_CENTER_TIMELINE.eventConnectorStem,
              COMMAND_CENTER_TIMELINE.connectorStem,
            )}
            aria-hidden="true"
          />
        )}
      </div>
      <div className={COMMAND_CENTER_TIMELINE.eventBody}>
        <div className={COMMAND_CENTER_TIMELINE.eventTitleRow}>
          <Badge variant={categoryConfig.badgeVariant} size="xs" className={categoryConfig.iconClass}>
            {categoryConfig.label}
          </Badge>
          <span className={COMMAND_CENTER_TIMELINE.eventAction}>{formatted.action}</span>
        </div>
        {formatted.details.length > 0 && (
          <div className={COMMAND_CENTER_TIMELINE.eventDetails}>
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
          <p className="text-xs text-text-secondary mt-1 whitespace-pre-wrap">{formatted.note}</p>
        )}
        <p className={COMMAND_CENTER_TIMELINE.eventMeta}>
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

export const LabAuditTimeline: React.FC<LabAuditTimelineProps> = ({
  events,
  variant = 'entity',
  interactiveEntities = false,
  emptyMessage = 'No recorded actions yet.',
  className,
  footer,
}) => {
  const { openSample, openOrderTest } = useOpenHistoricalLabRecord();
  const showRetestDividers = variant === 'entity';

  const grouped = useMemo(() => {
    const groups: { label: string; items: TimelineGroupItem[] }[] = [];
    let currentLabel: string | null = null;
    let previousEvent: TimelineEvent | undefined;

    for (const event of events) {
      const label = formatRelativeDateLabel(event.timestamp);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [] });
      }
      const group = groups[groups.length - 1];

      if (showRetestDividers) {
        const divider = getRetestAttemptDivider(event, previousEvent);
        if (divider) {
          group.items.push({ kind: 'divider', testId: divider.testId });
        }
      }

      group.items.push({ kind: 'event', event });
      previousEvent = event;
    }
    return groups;
  }, [events, showRetestDividers]);

  if (events.length === 0) {
    return <p className="text-sm text-text-tertiary">{emptyMessage}</p>;
  }

  return (
    <div className={cn('overflow-y-auto pr-1', className ?? 'max-h-80')}>
      {grouped.map(group => (
        <div key={group.label} className="mb-2">
          <div className={COMMAND_CENTER_TIMELINE.groupHeader}>
            <span className={COMMAND_CENTER_TIMELINE.groupLabel}>{group.label}</span>
            <div className={COMMAND_CENTER_TIMELINE.groupDivider} />
          </div>
          <ul className="space-y-0">
            {group.items.map((item, idx) => {
              if (item.kind === 'divider') {
                return (
                  <li key={`divider-${group.label}-${idx}`} className="py-1.5 pl-5">
                    <span className={COMMAND_CENTER_TIMELINE.eventDetailText}>Retest attempt · </span>
                    <EntityId type="orderTest" value={item.testId} variant="inline" />
                  </li>
                );
              }
              const isLast = idx === group.items.length - 1;
              return (
                <TimelineEventRow
                  key={item.event.id}
                  event={item.event}
                  isLast={isLast}
                  variant={variant}
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

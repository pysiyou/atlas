/**
 * LabTimeline — vertical timeline for lab entity audit history (sample / test panels).
 */
import React, { useMemo } from 'react';
import { Badge } from '@/components';
import { cn, formatRelativeDateLabel, formatRelativeDateTime } from '@/utils';
import { ENTITY_ID, ENTITY_ID_CLICKABLE } from '@/utils/constants';
import type { TimelineEvent } from '@/features/lab/api/commandCenter.api';
import { COMMAND_CENTER_TIMELINE } from '@/features/lab/command-center/components/styles';
import { useOpenHistoricalEntity } from '@/features/lab/hooks/useOpenHistoricalEntity';
import {
  getEntityCategoryConfig,
  getEntityEventCategory,
  getEntityEventTone,
} from '@/features/lab/timeline/entityTimelineCategories';
import {
  formatEntityTimelineEvent,
  getRetestAttemptDivider,
} from '@/features/lab/timeline/formatEntityTimelineEvent';
import type { EventDetail } from '@/features/lab/timeline/timelineDetailBuilders';

export interface LabTimelineProps {
  events: TimelineEvent[];
  interactiveEntities?: boolean;
  emptyMessage?: string;
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
      return <span className="text-xs text-text-secondary">Notes: {detail.value}</span>;
    case 'status':
    case 'sampleType':
      return <Badge variant={detail.value} size="xs" />;
    case 'testCode':
    case 'id':
      return <span className={ENTITY_ID}>{detail.value}</span>;
    case 'entityRef':
      if (!interactiveEntities) {
        return <span className={ENTITY_ID}>{detail.value}</span>;
      }
      return (
        <button
          type="button"
          className={ENTITY_ID_CLICKABLE}
          onClick={e => {
            e.stopPropagation();
            if (detail.entityType === 'sample') onOpenSample(detail.entityId);
            else onOpenOrderTest(detail.entityId);
          }}
        >
          {detail.value}
        </button>
      );
    default:
      return <span className="text-xs text-text-secondary">{detail.value}</span>;
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
  const category = getEntityEventCategory(event);
  const categoryConfig = getEntityCategoryConfig(category);
  const tone = getEntityEventTone(event);
  const formatted = formatEntityTimelineEvent(event);

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
          {event.performedByName ?? (event.performedBy === 'system' ? 'System' : 'Unknown')} ·{' '}
          <time dateTime={event.timestamp} title={formatRelativeDateTime(event.timestamp)}>
            {formatRelativeDateLabel(event.timestamp)}
          </time>
        </p>
      </div>
    </li>
  );
}

type TimelineGroupItem =
  | { kind: 'divider'; label: string }
  | { kind: 'event'; event: TimelineEvent };

export const LabTimeline: React.FC<LabTimelineProps> = ({
  events,
  interactiveEntities = false,
  emptyMessage = 'No recorded actions yet.',
}) => {
  const { openSample, openOrderTest } = useOpenHistoricalEntity();

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

      const divider = getRetestAttemptDivider(event, previousEvent);
      if (divider) {
        group.items.push({ kind: 'divider', label: divider });
      }

      group.items.push({ kind: 'event', event });
      previousEvent = event;
    }
    return groups;
  }, [events]);

  if (events.length === 0) {
    return <p className="text-sm text-text-tertiary">{emptyMessage}</p>;
  }

  return (
    <div className="max-h-80 overflow-y-auto pr-1">
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
                    <span className={COMMAND_CENTER_TIMELINE.groupLabel}>{item.label}</span>
                  </li>
                );
              }
              const isLast = idx === group.items.length - 1;
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
    </div>
  );
};

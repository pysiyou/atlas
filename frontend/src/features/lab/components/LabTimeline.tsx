/**
 * LabTimeline — reusable vertical timeline for lab audit events.
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components';
import { cn, formatRelativeDateLabel, formatRelativeDateTime } from '@/utils';
import { ENTITY_ID, ENTITY_ID_CLICKABLE } from '@/utils/constants';
import type { TimelineEvent } from '@/features/lab/api/commandCenter.api';
import {
  formatActivityEvent,
  type EventDetail,
} from '@/features/lab/command-center/formatActivityEvent';
import {
  getCategoryConfig,
  getEventCategory,
  getEventTone,
} from '@/features/lab/command-center/activityCategories';
import { COMMAND_CENTER_TIMELINE } from '@/features/lab/command-center/components/styles';
import { useOpenHistoricalEntity } from '@/features/lab/hooks/useOpenHistoricalEntity';

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
  const category = getEventCategory(event.type);
  const categoryConfig = getCategoryConfig(category);
  const tone = getEventTone(event);
  const formatted = formatActivityEvent(event, { interactiveEntities });

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

export const LabTimeline: React.FC<LabTimelineProps> = ({
  events,
  interactiveEntities = false,
  emptyMessage = 'No activity recorded.',
}) => {
  const { openSample, openOrderTest } = useOpenHistoricalEntity();

  const grouped = useMemo(() => {
    const groups: { label: string; events: TimelineEvent[] }[] = [];
    let currentLabel: string | null = null;
    for (const event of events) {
      const label = formatRelativeDateLabel(event.timestamp);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, events: [event] });
      } else {
        groups[groups.length - 1].events.push(event);
      }
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
            {group.events.map((event, idx) => (
              <TimelineEventRow
                key={event.id}
                event={event}
                isLast={idx === group.events.length - 1}
                interactiveEntities={interactiveEntities}
                onOpenSample={openSample}
                onOpenOrderTest={openOrderTest}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

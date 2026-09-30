import React, { useMemo } from 'react';
import { format, isSameDay, startOfDay } from 'date-fns';
import { EmptyState } from '@/components/display/EmptyState';
import { InlineHighlight } from '@/components/primitives/InlineHighlight';
import { RADIUS, SPACING, TYPE } from '@/components/theme/recipes';
import { ICONS } from '@/config/icons';
import { getLaneVisual, parseResultEntry, statusMapFromFlags, type LabTimelineLane } from '@/features/lab';
import { parseAppDate } from '@/utils/date';
import { cn } from '@/utils';
import { EVENT_LOG_COPY } from './types';
import type {
  EventLogDayGroup,
  EventLogDomain,
  EventLogLaboratorySubdomain,
  ResolvedEventLogItem,
} from './types';

const EVENT_LOG_HEADLINE_LINE_CLASS = 'leading-5';

const EVENT_LOG_STYLES = {
  feed: `flex flex-col ${SPACING.stackNormal} px-space-3 py-space-3`,
  dateDivider: 'flex w-full min-w-0 justify-end py-space-1',
  dateDividerLabel: `${TYPE.caption} shrink-0 text-text-tertiary`,
  row: 'relative flex items-start gap-space-3',
  spineColumn: 'relative w-3 shrink-0 self-stretch',
  spineStemTop:
    'event-log-spine-stem-top pointer-events-none absolute left-1/2 top-0 w-px -translate-x-1/2 bg-border-default h-[calc(0.625rem-0.1875rem-0.25rem)]',
  spineStemBottom:
    'event-log-spine-stem-bottom pointer-events-none absolute bottom-0 left-1/2 w-px -translate-x-1/2 bg-border-default top-[calc(0.625rem+0.1875rem+0.25rem)]',
  spineDotSlot: 'relative z-[1] flex h-5 w-full shrink-0 items-center justify-center',
  spineDot: `h-1.5 w-1.5 shrink-0 ${RADIUS.pill} ring-1 ring-surface`,
  spineDotMuted: 'bg-text-tertiary',
  content: 'event-log-content min-w-0 flex-1 pb-space-2',
  headline: `${TYPE.value} ${EVENT_LOG_HEADLINE_LINE_CLASS} mb-0`,
  headlineActor: 'font-medium text-text-primary',
  headlinePrimary: 'font-medium text-text-primary',
  headlineSecondary: 'text-text-secondary',
  meta: `${TYPE.meta} text-text-tertiary`,
  detailSection: `${RADIUS.inset} space-y-space-0-5 bg-surface-hover px-space-2 py-space-2`,
  detailTitle: `${TYPE.caption} leading-tight font-normal`,
  detailBody: `${TYPE.value} leading-relaxed font-normal m-0`,
  detailContentClamp: 'line-clamp-2 min-w-0 break-words',
  detailResults: `${TYPE.value} leading-relaxed font-normal min-w-0 line-clamp-2 break-words`,
  detailLine: 'inline whitespace-nowrap',
  detailLineLabel: 'text-text-tertiary lowercase',
  detailLineValue: 'text-text-primary',
  rowList:
    '[&>*:first-child_.event-log-spine-stem-top]:hidden [&>*:last-child_.event-log-spine-stem-bottom]:hidden [&>*:last-child_.event-log-content]:pb-0',
} as const;

function eventLogPartClass(part: { text: string; main?: boolean }): string {
  if (part.main) return EVENT_LOG_STYLES.headlinePrimary;
  return EVENT_LOG_STYLES.headlineSecondary;
}

function dayKey(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd');
}

function dayGroupLabel(date: Date, now: Date): string {
  const weekday = format(date, 'EEE d MMM yyyy');
  if (isSameDay(date, now)) return `Today · ${weekday}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return `Yesterday · ${weekday}`;
  return weekday;
}

function groupEventLogByDay(items: ResolvedEventLogItem[]): EventLogDayGroup[] {
  const now = new Date();
  const map = new Map<string, EventLogDayGroup>();

  for (const item of items) {
    const parsed = parseAppDate(item.record.createdAt);
    if (!parsed) continue;
    const key = dayKey(parsed);
    const existing = map.get(key);
    if (existing) {
      existing.items.push(item);
      continue;
    }
    map.set(key, {
      dayKey: key,
      label: dayGroupLabel(parsed, now),
      items: [item],
    });
  }

  return Array.from(map.values()).sort((a, b) => b.dayKey.localeCompare(a.dayKey));
}

function laneForDomain(
  domain: EventLogDomain,
  laboratorySubdomain?: EventLogLaboratorySubdomain
): LabTimelineLane {
  if (domain === 'laboratory' && laboratorySubdomain) {
    switch (laboratorySubdomain) {
      case 'sample':
        return 'sample';
      case 'result':
        return 'results';
      case 'validation':
        return 'validation';
      case 'escalation':
        return 'escalation';
      case 'quality':
        return 'quality';
    }
  }
  switch (domain) {
    case 'patient':
      return 'composition';
    case 'order':
      return 'order';
    case 'billing':
      return 'composition';
    case 'reporting':
      return 'composition';
    case 'system':
      return 'order';
    case 'laboratory':
      return 'results';
  }
}

function EventLogResultsList({
  results,
  flags,
}: {
  results: Record<string, unknown>;
  flags?: string[];
}) {
  const flagStatusMap = useMemo(() => statusMapFromFlags(flags), [flags]);
  const entries = Object.entries(results ?? {});

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={EVENT_LOG_STYLES.detailResults}>
      {entries.map(([key, rawValue], index) => {
        const { resultValue, unit } = parseResultEntry(key, rawValue, flagStatusMap);
        const valueLabel = unit ? `${resultValue} ${unit}` : resultValue;
        return (
          <span
            key={key}
            className={cn(EVENT_LOG_STYLES.detailLine, index < entries.length - 1 && 'mr-space-4')}
          >
            <span className={EVENT_LOG_STYLES.detailLineLabel}>{key}: </span>
            <span className={EVENT_LOG_STYLES.detailLineValue}>{valueLabel}</span>
          </span>
        );
      })}
    </div>
  );
}

function EventLogSpineNode({ item }: { item: ResolvedEventLogItem }) {
  const lane = laneForDomain(item.domain, item.laboratorySubdomain);
  const visual = getLaneVisual(lane);

  return (
    <div
      className={cn(
        EVENT_LOG_STYLES.spineDot,
        item.isSystemActor ? EVENT_LOG_STYLES.spineDotMuted : visual.bar
      )}
      aria-hidden
    />
  );
}

function EventLogDetailBox({ item }: { item: ResolvedEventLogItem }) {
  const { narrativeLabel, narrativeText, results, resultFlags } = item;
  const hasResults = results && Object.keys(results).length > 0;
  const hasNote = Boolean(narrativeText?.trim());

  if (!hasResults && !hasNote) return null;

  return (
    <>
      {hasResults ? (
        <div className={EVENT_LOG_STYLES.detailSection}>
          <div className={EVENT_LOG_STYLES.detailTitle}>{EVENT_LOG_COPY.resultTitle}</div>
          <EventLogResultsList results={results!} flags={resultFlags} />
        </div>
      ) : null}
      {hasNote ? (
        <div className={EVENT_LOG_STYLES.detailSection}>
          <div className={EVENT_LOG_STYLES.detailTitle}>
            {narrativeLabel ?? EVENT_LOG_COPY.narrativeDefaultLabel}
          </div>
          <p className={cn(EVENT_LOG_STYLES.detailBody, EVENT_LOG_STYLES.detailContentClamp)}>
            {narrativeText}
          </p>
        </div>
      ) : null}
    </>
  );
}

function EventLogRow({ item }: { item: ResolvedEventLogItem }) {
  const { headline, headlineParts, omitActorInHeadline } = item;
  return (
    <div className={EVENT_LOG_STYLES.row}>
      <div className={EVENT_LOG_STYLES.spineColumn} aria-hidden>
        <div className={EVENT_LOG_STYLES.spineStemTop} />
        <div className={EVENT_LOG_STYLES.spineStemBottom} />
        <div className={EVENT_LOG_STYLES.spineDotSlot}>
          <EventLogSpineNode item={item} />
        </div>
      </div>
      <div className={EVENT_LOG_STYLES.content}>
        <p className={EVENT_LOG_STYLES.headline}>
          {!omitActorInHeadline ? (
            <>
              <span className={EVENT_LOG_STYLES.headlineActor}>{headline.actorName}</span>{' '}
            </>
          ) : null}
          {headlineParts.length > 0 ? (
            headlineParts.map((part, index) => {
              if (part.variant != null) {
                return (
                  <InlineHighlight
                    key={`${part.text}-${index}`}
                    variant={part.variant}
                    icon={part.icon}
                    decoration={part.decoration}
                    className={part.main ? EVENT_LOG_STYLES.headlinePrimary : undefined}
                  >
                    {part.text}
                  </InlineHighlight>
                );
              }
              return (
                <span key={`${part.text}-${index}`} className={cn(eventLogPartClass(part))}>
                  {part.text}
                </span>
              );
            })
          ) : (
            <>
              <span className={EVENT_LOG_STYLES.headlineSecondary}>{headline.verbPhrase} </span>
              <span
                className={cn(eventLogPartClass({ text: headline.targetLabel, main: true }))}
              >
                {headline.targetLabel}
              </span>
            </>
          )}
        </p>
        <EventLogDetailBox item={item} />
        <p className={cn(EVENT_LOG_STYLES.meta, 'mt-0 mb-0')}>
          {item.metaTime}
          <span className="mx-space-1" aria-hidden>
            ·
          </span>
          {item.domainLabel}
          {item.showEventTypeInMeta ? (
            <>
              <span className="mx-space-1" aria-hidden>
                ·
              </span>
              <span className="font-mono text-text-tertiary">{item.record.eventType}</span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

interface EventLogFeedProps {
  items: ResolvedEventLogItem[];
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const EventLogFeed: React.FC<EventLogFeedProps> = ({
  items,
  className,
  emptyTitle = EVENT_LOG_COPY.emptyTitle,
  emptyDescription = EVENT_LOG_COPY.emptyDescription,
}) => {
  const dayGroups = useMemo(() => groupEventLogByDay(items), [items]);

  if (items.length === 0) {
    return (
      <EmptyState
        variant="dense"
        fill
        icon={ICONS.dataFields.clock}
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  return (
    <div className={`${EVENT_LOG_STYLES.feed} ${className ?? ''}`}>
      {dayGroups.map(group => (
        <section key={group.dayKey} aria-label={group.label}>
          <div className={EVENT_LOG_STYLES.dateDivider}>
            <span className={EVENT_LOG_STYLES.dateDividerLabel}>{group.label}</span>
          </div>
          <div className={`mt-space-3 flex flex-col ${EVENT_LOG_STYLES.rowList}`}>
            {group.items.map(item => (
              <EventLogRow key={item.record.eventId} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

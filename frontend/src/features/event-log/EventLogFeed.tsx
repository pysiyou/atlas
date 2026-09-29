import React, { useMemo } from 'react';
import { EmptyState } from '@/components/display/EmptyState';
import { ICONS } from '@/config/icons';
import { EVENT_LOG_COPY } from './copy';
import { EventLogRow } from './EventLogRow';
import { groupEventLogByDay } from './groupByDay';
import { EVENT_LOG_STYLES } from './styles';
import type { ResolvedEventLogItem } from './types';

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

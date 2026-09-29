/**
 * Plain result lines for the event log detail box (not lab card grid styling).
 */
import React, { useMemo } from 'react';
import { parseResultEntry, statusMapFromFlags } from '@/features/lab';
import { cn } from '@/utils';
import { EVENT_LOG_STYLES } from './styles';

interface EventLogResultsListProps {
  results: Record<string, unknown>;
  flags?: string[];
}

export const EventLogResultsList: React.FC<EventLogResultsListProps> = ({ results, flags }) => {
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
};

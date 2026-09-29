/**
 * Plain result lines for the event log detail box (not lab card grid styling).
 */
import React, { useMemo } from 'react';
import { parseResultEntry, statusMapFromFlags } from '@/features/lab/utils/labResult';
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
    <ul className={EVENT_LOG_STYLES.detailList}>
      {entries.map(([key, rawValue]) => {
        const { resultValue, unit } = parseResultEntry(key, rawValue, flagStatusMap);
        const valueLabel = unit ? `${resultValue} ${unit}` : resultValue;
        return (
          <li key={key} className={EVENT_LOG_STYLES.detailBody}>
            {key}: {valueLabel}
          </li>
        );
      })}
    </ul>
  );
};

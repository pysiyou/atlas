/**
 * Value + unit + abnormal status text (shared by result grids and event log).
 */
import { cn } from '@/utils';
import { text, METRIC_TILE } from '@/theme/recipes';
import type { ResultStatus } from '@/types/enums';
import {
  resultStatusLabel,
  resultValueClass,
} from '../utils/labResult';

export function ResultValueAnnotations({
  resultValue,
  unit,
  status,
  dense = false,
  tile = false,
  showStatus = true,
}: {
  resultValue: string;
  unit: string;
  status: ResultStatus;
  dense?: boolean;
  tile?: boolean;
  /** Queue cards: value (+ unit) only; status chips in validation detail. */
  showStatus?: boolean;
}) {
  const statusLabel = showStatus ? resultStatusLabel(status) : null;
  const valueTone = showStatus ? resultValueClass(status) : 'text-text-primary';
  const valueType = dense ? text({ role: 'caption' }) : tile ? METRIC_TILE.value : text({ role: 'body' });

  return (
    <span
      className={cn(
        'inline-flex items-baseline flex-wrap gap-x-space-1 gap-y-0 justify-start min-w-0',
        valueType,
        'font-normal tabular-nums',
        valueTone
      )}
    >
      <span>{resultValue}</span>
      {(unit || statusLabel) && (
        <span className="inline-flex items-baseline gap-space-1 shrink-0">
          {unit && (
            <span className={cn(METRIC_TILE.unit, 'ml-0 text-text-tertiary', dense && text({ role: 'caption' }))}>
              {unit}
            </span>
          )}
          {statusLabel && (
            <span className={cn(text({ role: 'caption' }), 'font-medium', resultValueClass(status))}>
              {statusLabel}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

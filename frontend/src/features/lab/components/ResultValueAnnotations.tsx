/**
 * Value + unit + abnormal status text (shared by result grids and event log).
 */
import { cn } from '@/utils';
import { text, METRIC_TILE , FG } from '@/theme/recipes';
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
  truncate = false,
}: {
  resultValue: string;
  unit: string;
  status: ResultStatus;
  dense?: boolean;
  tile?: boolean;
  /** Queue cards: value (+ unit) only; status chips in validation detail. */
  showStatus?: boolean;
  /** Ellipsis overflow with `title` set to the full value line. */
  truncate?: boolean;
}) {
  const statusLabel = showStatus ? resultStatusLabel(status) : null;
  const valueTone = showStatus ? resultValueClass(status) : FG.body;
  const valueType = dense ? text({ role: 'caption' }) : tile ? METRIC_TILE.value : text({ role: 'body' });
  const fullLine = [resultValue, unit, statusLabel].filter(Boolean).join(' ');

  return (
    <span
      className={cn(
        truncate
          ? 'flex min-w-0 max-w-full items-baseline gap-x-space-1 overflow-hidden'
          : 'inline-flex min-w-0 flex-wrap items-baseline justify-start gap-x-space-1 gap-y-0',
        valueType,
        'font-normal tabular-nums',
        valueTone
      )}
      title={truncate ? fullLine : undefined}
    >
      <span className={cn(truncate && 'min-w-0 truncate')}>{resultValue}</span>
      {(unit || statusLabel) && (
        <span className="inline-flex items-baseline gap-space-1 shrink-0">
          {unit && (
            <span
              className={cn(
                tile ? METRIC_TILE.unit : text({ role: 'caption', intent: 'muted' }),
                'ml-space-1 font-normal tabular-nums'
              )}
            >
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

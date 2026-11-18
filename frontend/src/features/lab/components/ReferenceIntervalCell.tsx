/**
 * Reference interval — stacked rows when multiple bands; label + value columns stay aligned.
 */
import { Fragment } from 'react';
import { text, FG } from '@/theme/recipes';
import type { ReferenceIntervalLine } from '../utils/labResult';

export function ReferenceIntervalCell({
  lines,
  valueColumnCh,
}: {
  lines: ReferenceIntervalLine[];
  /** Longest range string in the table (tabular-nums ch units). */
  valueColumnCh: number;
}) {
  const bodyClass = `${text({ role: 'body', intent: 'muted' })} leading-snug`;

  if (lines.length <= 1) {
    const line = lines[0] ?? { value: '—' };
    return (
      <span className={`tabular-nums text-left ${bodyClass} ${FG.body}`}>{line.value}</span>
    );
  }

  return (
    <div
      className={`inline-grid gap-x-space-1 gap-y-0.5 items-baseline leading-snug ${text({ role: 'caption' })} text-left`}
      style={{ gridTemplateColumns: `auto ${Math.max(valueColumnCh, 4)}ch` }}
    >
      {lines.map((line, index) => (
        <Fragment key={index}>
          <span className={`whitespace-nowrap text-right ${bodyClass} ${FG.captionMuted}`}>
            {line.label ?? ''}
          </span>
          <span className={`tabular-nums text-left ${bodyClass} ${FG.body}`}>{line.value}</span>
        </Fragment>
      ))}
    </div>
  );
}
/**
 * Reference interval — shared value column width (ch) so sex labels align; values left-aligned.
 */
import { Fragment } from 'react';
import {text, FG } from '@/theme/recipes';
import type { ReferenceIntervalLine } from '../utils/labResult';

export function ReferenceIntervalCell({
  lines,
  valueColumnCh,
}: {
  lines: ReferenceIntervalLine[];
  /** Longest range string in the table (tabular-nums ch units). */
  valueColumnCh: number;
}) {
  return (
    <div
      className={`inline-grid gap-x-space-1 gap-y-0 items-baseline leading-none ${text({ role: 'caption' })} text-left`}
      style={{ gridTemplateColumns: `${valueColumnCh}ch auto` }}
    >
      {lines.map((line, index) => (
        <Fragment key={index}>
          <span className={`tabular-nums text-left ${text({ role: 'body', intent: 'muted' })} ${FG.body}`}>
            {line.value}
          </span>
          <span className={`whitespace-nowrap ${text({ role: 'body', intent: 'muted' })} ${FG.captionMuted}`}>
            {line.label ?? ''}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

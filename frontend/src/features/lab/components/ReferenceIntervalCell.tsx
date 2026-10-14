/**
 * Reference interval — fixed-width value column so Male/Female labels align across all rows.
 */
import { Fragment } from 'react';
import { TYPE } from '@/components/theme/recipes';
import type { ReferenceIntervalLine } from '../utils/labResult';

/** Shared across every cell so sex labels line up in the reference column. */
const VALUE_COLUMN_CLASS = 'w-[7.5rem] max-w-[7.5rem]';

export function ReferenceIntervalCell({ lines }: { lines: ReferenceIntervalLine[] }) {
  return (
    <div
      className={`inline-grid grid-cols-[7.5rem_auto] gap-x-space-2 gap-y-space-0.5 items-baseline ${TYPE.caption} text-text-tertiary text-left`}
    >
      {lines.map((line, index) => (
        <Fragment key={index}>
          <span className={`tabular-nums ${VALUE_COLUMN_CLASS}`}>{line.value}</span>
          <span className="whitespace-nowrap">{line.label ?? ''}</span>
        </Fragment>
      ))}
    </div>
  );
}

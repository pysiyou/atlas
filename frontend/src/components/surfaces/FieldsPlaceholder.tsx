/**
 * One body placeholder for panels and tables: a short line, then a full-width line of the same height.
 * All pairs are painted in one pass after the container height is known.
 */

import { useLayoutEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/feedback/Skeleton';

export const FIELDS_PLACEHOLDER_ROWS = 6;

/** Padding when the placeholder fills a table or list body under a real header. */
export const FIELDS_PLACEHOLDER_TABLE_INSET = 'min-h-[12rem] px-table-cell-x-default py-space-4';

const LINE_HEIGHT_PX = 12;
/** Matches `gap-space-1` between the short and full line. */
const PAIR_INNER_GAP_PX = 4;
const PAIR_HEIGHT_PX = LINE_HEIGHT_PX * 2 + PAIR_INNER_GAP_PX;
const FILL_MAX = 48;

export interface FieldsPlaceholderProps {
  /** Max pairs. Omit to fill the container (tables). */
  rows?: number;
  className?: string;
}

function countPairs(availablePx: number, stackGapPx: number, max: number): number {
  if (availablePx <= 0) return 0;
  const fit = Math.floor((availablePx + stackGapPx) / (PAIR_HEIGHT_PX + stackGapPx));
  return Math.max(1, Math.min(max, fit));
}

/**
 * Short line (1/3 width) + full-width line, repeated to the available height.
 */
export function FieldsPlaceholder({ rows, className = '' }: FieldsPlaceholderProps) {
  const max = rows != null && Number.isInteger(rows) && rows > 0 ? rows : FILL_MAX;
  const rootRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const update = () => {
      if (root.clientHeight <= 0) return;
      const styles = getComputedStyle(root);
      const gap = parseFloat(styles.rowGap) || 0;
      const pad = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
      const next = countPairs(root.clientHeight - pad, gap, max);
      if (next < 1) return;
      setCount(current => (current === next ? current : next));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, [max]);

  return (
    <div
      ref={rootRef}
      className={`flex h-full min-h-0 flex-1 flex-col gap-space-3 overflow-hidden ${className}`.trim()}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex w-full flex-col gap-space-1">
          <Skeleton height={LINE_HEIGHT_PX} width="33%" />
          <Skeleton height={LINE_HEIGHT_PX} width="100%" />
        </div>
      ))}
    </div>
  );
}

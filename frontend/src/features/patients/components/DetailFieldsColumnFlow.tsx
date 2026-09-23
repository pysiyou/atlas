/**
 * DetailFieldsColumnFlow
 * Stacks detail fields vertically in two columns: column one fills first, then column two.
 */

import React from 'react';
import { SPACING } from '@/components/theme/recipes';
import { cn } from '@/utils';

export interface DetailFieldsColumnFlowProps {
  children: React.ReactNode;
  className?: string;
  /** When true, the block grows with content and scrolls via a parent. */
  scrollable?: boolean;
}

/** Splits items so the first column receives the first half (rounded up). */
function splitIntoColumns(items: React.ReactNode[]): [React.ReactNode[], React.ReactNode[]] {
  const splitAt = Math.ceil(items.length / 2);
  return [items.slice(0, splitAt), items.slice(splitAt)];
}

function Column({ items }: { items: React.ReactNode[] }) {
  return (
    <div className={cn('flex min-w-0 flex-col', SPACING.gapRelaxed)}>
      {items.map((child, index) => (
        <div key={index} className="min-w-0 w-full">
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * Renders fields top-to-bottom in column one, then continues in column two.
 * On narrow viewports, fields stay in a single vertical list.
 */
export const DetailFieldsColumnFlow: React.FC<DetailFieldsColumnFlowProps> = ({
  children,
  className,
  scrollable = true,
}) => {
  const items = React.Children.toArray(children).filter(Boolean);
  const [firstColumn, secondColumn] = splitIntoColumns(items);

  const grid = (
    <div
      className={cn(
        'grid w-full min-h-0 grid-cols-1 items-start gap-x-layout-section',
        'sm:grid-cols-2',
        className
      )}
    >
      <Column items={firstColumn} />
      {secondColumn.length > 0 ? <Column items={secondColumn} /> : null}
    </div>
  );

  if (!scrollable) {
    return grid;
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{grid}</div>
  );
};

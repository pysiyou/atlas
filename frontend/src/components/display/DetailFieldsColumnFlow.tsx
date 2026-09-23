/**
 * DetailFieldsColumnFlow — two-column vertical flow for detail fields.
 */

import React from 'react';
import { SPACING } from '@/components/theme/recipes';
import { cn } from '@/utils';

export interface DetailFieldsColumnFlowProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

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
        className,
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

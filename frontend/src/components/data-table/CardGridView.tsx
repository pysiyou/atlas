/**
 * CardGridView — mobile/responsive card list for DataTable.
 * When a scroll parent is provided (DataTable sm path), rows are virtualized.
 */

import { type ComponentType, type RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LAYOUT } from '@/theme/recipes';
import { cn } from '@/utils';
import type { CardComponentProps } from './types';

export type CardGridColumns = '1' | '1-2' | '1-2-3';

const GRID_CLASS: Record<CardGridColumns, string> = {
  '1': 'grid grid-cols-1',
  '1-2': 'grid grid-cols-1 md:grid-cols-2',
  '1-2-3': 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
};

/** Estimated card height until measureElement reports the real node. */
const ESTIMATED_CARD_HEIGHT_PX = 120;
const CARD_OVERSCAN = 8;

interface CardGridViewProps<T> {
  data: T[];
  CardComponent: ComponentType<CardComponentProps<T>>;
  onRowClick?: (item: T, index: number) => void;
  getRowKey?: (item: T, index: number) => string | number;
  columns?: CardGridColumns;
  className?: string;
  gapClassName?: string;
  /** Overflow parent from DataTable — enables 1-column virtualization. */
  scrollRef?: RefObject<HTMLDivElement | null>;
}

export function CardGridView<T>({
  data,
  CardComponent,
  onRowClick,
  getRowKey,
  columns = '1-2',
  className,
  gapClassName = LAYOUT.balancedColumns,
  scrollRef,
}: CardGridViewProps<T>) {
  const virtualize = Boolean(scrollRef) && data.length > 0;
  // eslint-disable-next-line react-hooks/incompatible-library -- @tanstack/react-virtual
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollRef?.current ?? null,
    estimateSize: () => ESTIMATED_CARD_HEIGHT_PX,
    overscan: CARD_OVERSCAN,
    enabled: virtualize,
  });

  if (!virtualize) {
    return (
      <div className={cn(GRID_CLASS[columns], gapClassName, className)}>
        {data.map((item, index) => {
          const rowKey = getRowKey ? getRowKey(item, index) : index;
          return (
            <CardComponent
              key={rowKey}
              item={item}
              index={index}
              onClick={() => onRowClick?.(item, index)}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('relative w-full', className)} style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map(virtualRow => {
        const item = data[virtualRow.index];
        if (item === undefined) return null;
        const rowKey = getRowKey ? getRowKey(item, virtualRow.index) : virtualRow.index;
        return (
          <div
            key={rowKey}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className="absolute left-0 top-0 w-full pb-layout-section"
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            <CardComponent
              item={item}
              index={virtualRow.index}
              onClick={() => onRowClick?.(item, virtualRow.index)}
            />
          </div>
        );
      })}
    </div>
  );
}

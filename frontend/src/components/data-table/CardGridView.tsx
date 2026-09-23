import type { ComponentType } from 'react';
import { LAYOUT } from '@/components/theme/recipes';
import { cn } from '@/utils';
import type { CardComponentProps } from './types';

export type CardGridColumns = '1' | '1-2' | '1-2-3';

const GRID_CLASS: Record<CardGridColumns, string> = {
  '1': 'grid grid-cols-1',
  '1-2': 'grid grid-cols-1 md:grid-cols-2',
  '1-2-3': 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
};

interface CardGridViewProps<T> {
  data: T[];
  CardComponent: ComponentType<CardComponentProps<T>>;
  onRowClick?: (item: T, index: number) => void;
  getRowKey?: (item: T, index: number) => string | number;
  columns?: CardGridColumns;
  className?: string;
  gapClassName?: string;
}

export function CardGridView<T>({
  data,
  CardComponent,
  onRowClick,
  getRowKey,
  columns = '1-2',
  className,
  gapClassName = LAYOUT.balancedColumns,
}: CardGridViewProps<T>) {
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

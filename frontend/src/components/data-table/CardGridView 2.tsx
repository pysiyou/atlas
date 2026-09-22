import type { ComponentType } from 'react';
import type { CardComponentProps } from './types';

interface CardGridViewProps<T> {
  data: T[];
  CardComponent: ComponentType<CardComponentProps<T>>;
  onRowClick?: (item: T, index: number) => void;
  getRowKey?: (item: T, index: number) => string | number;
}

export function CardGridView<T>({
  data,
  CardComponent,
  onRowClick,
  getRowKey,
}: CardGridViewProps<T>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-layout-section">
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

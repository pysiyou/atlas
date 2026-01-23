import type { CardComponentProps } from './types';

/**
 * Props for CardGrid component
 */
interface CardGridProps<T> {
  /** Array of data items to display */
  data: T[];
  /** Custom card component to render for each item */
  CardComponent: React.ComponentType<CardComponentProps<T>>;
  /** Row click handler */
  onRowClick?: (item: T, index: number) => void;
  /** Row key extractor (default: uses index) */
  getRowKey?: (item: T, index: number) => string | number;
}

/**
 * CardGrid Component
 *
 * Grid wrapper for custom card components used in mobile view.
 * Displays cards in a responsive grid layout (1 column on mobile, 2 columns on larger screens).
 *
 * @param data - Array of data items to display
 * @param CardComponent - Custom card component to render for each item
 * @param onRowClick - Optional click handler for card clicks
 * @param getRowKey - Optional function to generate unique keys for cards
 */
export function CardGrid<T>({ data, CardComponent, onRowClick, getRowKey }: CardGridProps<T>) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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

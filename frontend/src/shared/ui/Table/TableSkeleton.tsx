import { Skeleton } from '../feedback/Skeleton';
import type { TableSkeletonProps } from './types';
import { useColumnStyles } from './hooks/useColumnWidth';
import { ROW_HEIGHTS, CELL_PADDING, TEXT_SIZE } from './constants';

/**
 * Table Skeleton Component
 * Shows loading skeleton for table rows
 */
export function TableSkeleton({ columns, rows, variant }: TableSkeletonProps) {
  const columnStyles = useColumnStyles(columns);

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center border-b border-border-default"
          style={{ height: `${ROW_HEIGHTS[variant]}px` }}
        >
          {columns.map(column => {
            const style = columnStyles.get(column.key) || {};
            // Vary skeleton width for visual interest
            const skeletonWidth = rowIndex % 3 === 0 ? '90%' : rowIndex % 3 === 1 ? '75%' : '85%';

            return (
              <div
                key={column.key}
                className={`${CELL_PADDING[variant]} ${TEXT_SIZE[variant]}`}
                style={style}
              >
                <Skeleton height={16} width={skeletonWidth} />
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

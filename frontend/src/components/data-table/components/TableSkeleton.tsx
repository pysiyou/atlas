import { Skeleton } from '@/components';
import { useColumnStyles } from '@/hooks/useTable';
import type { TableSkeletonProps } from '../types';
import { CELL_PADDING, ROW_HEIGHTS, TEXT_SIZE } from '../constants';

export function TableSkeleton<T = unknown>({ columns, rows, variant }: TableSkeletonProps<T>) {
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

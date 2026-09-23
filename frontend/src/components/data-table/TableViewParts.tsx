/**
 * TableView presentational subcomponents (header, cells, rows, skeleton).
 */

import { Icon, Skeleton } from '@/components';
import { ICONS } from '@/config/icons';
import { getColumnStyle, useColumnStyles } from '@/hooks/useTable';
import type {
  ColumnConfig,
  TableBodyProps,
  TableCellProps,
  TableHeaderProps,
  TableSkeletonProps,
} from './types';
import { CELL_PADDING, HEADER_PADDING, ROW_HEIGHTS, TEXT_SIZE } from './constants';

export function TableHeader<T>({
  visibleColumns,
  sort,
  onSort,
  variant,
  sticky = false,
}: TableHeaderProps<T>) {
  const columnStyles = useColumnStyles(visibleColumns);
  return (
    <div
      className={`flex items-stretch border-b border-border-default bg-surface-table-header ${TEXT_SIZE[variant]} text-text-tertiary uppercase tracking-wider ${sticky ? 'sticky top-0 z-10' : ''}`}
      role="row"
    >
      {visibleColumns.map(column => {
        const style = columnStyles.get(column.key) || {};
        const isSortable = column.sortable;
        const isActiveSort = sort?.key === column.key;
        return (
          <div
            key={column.key}
            role="columnheader"
            className={`${HEADER_PADDING[variant]} ${TEXT_SIZE[variant]} flex items-center justify-start gap-space-2 whitespace-nowrap ${isSortable ? 'cursor-pointer hover:bg-surface-hover select-none' : ''} ${isActiveSort ? 'text-text-primary bg-surface-selected' : ''} ${column.headerClassName || ''}`.trim()}
            style={style}
            onClick={() => isSortable && onSort(column.key)}
            aria-sort={
              isActiveSort
                ? sort?.direction === 'asc'
                  ? 'ascending'
                  : 'descending'
                : isSortable
                  ? 'none'
                  : undefined
            }
          >
            <span>{column.header}</span>
            {isActiveSort && (
              <Icon
                name={sort.direction === 'asc' ? ICONS.actions.arrowUp : ICONS.actions.arrowDown}
                className="w-3.5 h-3.5"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TableCell({ column, children, variant }: TableCellProps) {
  const style = getColumnStyle(column);
  const alignClass =
    column.align === 'center'
      ? 'text-center justify-center'
      : column.align === 'right'
        ? 'text-right justify-end'
        : 'text-left justify-start';
  const innerJustifyClass =
    column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : 'justify-start';
  const stickyClass =
    column.sticky === 'left'
      ? 'sticky left-0 bg-surface z-[1]'
      : column.sticky === 'right'
        ? 'sticky right-0 bg-surface z-[1]'
        : '';
  const contentClass = column.truncate ? 'truncate' : '';
  return (
    <div
      className={`${CELL_PADDING[variant]} ${TEXT_SIZE[variant]} text-text-primary overflow-hidden flex items-center ${alignClass} ${contentClass} ${stickyClass} ${column.className || ''}`.trim()}
      style={style}
      role="cell"
    >
      <div className={`min-w-0 flex-1 flex items-center ${innerJustifyClass}`}>{children}</div>
    </div>
  );
}

const tableRow = {
  base: 'flex items-center border-b border-border-default transition-colors duration-200',
  clickable: 'cursor-pointer',
  hover: 'hover:bg-surface-hover',
  stripedEven: 'bg-surface',
  stripedOdd: 'bg-surface-hover/50',
};

export function TableRow<T>({
  data,
  visibleColumns,
  variant,
  striped = false,
  onRowClick,
  rowClassName,
  getRowKey,
}: TableBodyProps<T>) {
  return (
    <>
      {data.map((item, index) => {
        const rowKey = getRowKey ? getRowKey(item, index) : index;
        const isClickable = !!onRowClick;
        const customRowClass = rowClassName?.(item, index) ?? '';
        const stripeClass =
          striped && !customRowClass
            ? index % 2 === 0
              ? tableRow.stripedEven
              : tableRow.stripedOdd
            : '';
        return (
          <div
            key={rowKey}
            role="row"
            className={`${tableRow.base} ${isClickable ? `${tableRow.clickable} ${tableRow.hover}` : ''} ${stripeClass} ${customRowClass}`}
            style={{ height: `${ROW_HEIGHTS[variant]}px` }}
            onClick={() => onRowClick?.(item, index)}
          >
            {visibleColumns.map(column => (
              <TableCell
                key={column.key}
                column={column as ColumnConfig<unknown>}
                variant={variant}
              >
                {column.render ? (
                  column.render(item, index)
                ) : (
                  <span className={column.truncate ? 'block truncate' : ''}>
                    {String((item as Record<string, unknown>)[column.key] ?? '')}
                  </span>
                )}
              </TableCell>
            ))}
          </div>
        );
      })}
    </>
  );
}

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

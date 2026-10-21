/**
 * TableView presentational subcomponents (header, cells, rows, skeleton).
 */

import { Icon } from '@/components/primitives';
import { Skeleton } from '@/components/loaders';
import { ICONS } from '@/config/icons';
import { useGridTemplateColumns } from '@/hooks/useTable';
import type {
  ColumnConfig,
  TableBodyProps,
  TableCellProps,
  TableHeaderProps,
  TableSkeletonProps,
  TableVariant,
} from './types';
import { TABLE_SHELL, TABLE_TYPE } from '@/theme/recipes';
import { cn } from '@/utils';
import { composedTableCell } from './columnHelpers';
import { HEADER_PADDING, ROW_HEIGHTS } from './constants';

const TABLE_CELL_DENSITY = {
  compact: 'compact',
  default: 'md',
  comfortable: 'comfortable',
} as const satisfies Record<TableVariant, 'compact' | 'md' | 'comfortable'>;

export function TableHeader<T>({
  visibleColumns,
  sort,
  onSort,
  variant,
  sticky = false,
}: TableHeaderProps<T>) {
  const gridTemplateColumns = useGridTemplateColumns(visibleColumns);
  return (
    <div
      className={cn(TABLE_SHELL.headerRow, sticky && TABLE_SHELL.headerRowSticky)}
      style={{ gridTemplateColumns }}
      role="row"
    >
      {visibleColumns.map(column => {
        const isSortable = column.sortable;
        const isActiveSort = sort?.key === column.key;
        return (
          <div
            key={column.key}
            role="columnheader"
            className={cn(
              HEADER_PADDING[variant],
              TABLE_SHELL.headerCell,
              TABLE_TYPE.columnTitle,
              'justify-start text-left',
              isSortable && TABLE_TYPE.columnTitleSortable,
              isActiveSort && TABLE_TYPE.columnTitleActive,
              column.headerClassName,
            )}
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
  const stickyClass =
    column.sticky === 'left'
      ? 'sticky left-0 bg-surface z-[1]'
      : column.sticky === 'right'
        ? 'sticky right-0 bg-surface z-[1]'
        : '';
  const contentClass = column.truncate ? 'truncate' : '';
  return (
    <div
      className={cn(
        composedTableCell({
          density: TABLE_CELL_DENSITY[variant],
          tone: 'primary',
          align: 'start',
        }),
        TABLE_SHELL.bodyCell,
        contentClass,
        stickyClass,
        column.className,
      )}
      role="cell"
    >
      <div className="min-w-0 flex-1 flex items-center justify-start">{children}</div>
    </div>
  );
}

const tableRow = {
  base: TABLE_SHELL.row,
  clickable: TABLE_SHELL.rowClickable,
  stripedEven: TABLE_SHELL.rowStripedEven,
  stripedOdd: TABLE_SHELL.rowStripedOdd,
};

export interface TableDataRowProps<T> {
  item: T;
  /** Source index in the full dataset — used for stripes, keys, and aria-rowindex. */
  index: number;
  visibleColumns: ColumnConfig<T>[];
  variant: TableVariant;
  striped?: boolean;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
  gridTemplateColumns: string;
  /** 1-based aria-rowindex including the header when present. */
  ariaRowIndex?: number;
}

/**
 * One data row. Virtualizers render this by source index so stripes stay stable.
 */
export function TableDataRow<T>({
  item,
  index,
  visibleColumns,
  variant,
  striped = false,
  onRowClick,
  rowClassName,
  gridTemplateColumns,
  ariaRowIndex,
}: TableDataRowProps<T>) {
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
      role="row"
      aria-rowindex={ariaRowIndex}
      className={cn(tableRow.base, isClickable && tableRow.clickable, stripeClass, customRowClass)}
      style={{ gridTemplateColumns, height: `${ROW_HEIGHTS[variant]}px` }}
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
}

export function TableRow<T>({
  data,
  visibleColumns,
  variant,
  striped = false,
  onRowClick,
  rowClassName,
  getRowKey,
}: TableBodyProps<T>) {
  const gridTemplateColumns = useGridTemplateColumns(visibleColumns);
  return (
    <>
      {data.map((item, index) => (
        <TableDataRow
          key={getRowKey ? getRowKey(item, index) : index}
          item={item}
          index={index}
          visibleColumns={visibleColumns}
          variant={variant}
          striped={striped}
          onRowClick={onRowClick}
          rowClassName={rowClassName}
          gridTemplateColumns={gridTemplateColumns}
          ariaRowIndex={index + 1}
        />
      ))}
    </>
  );
}

export function TableSkeleton<T = unknown>({ columns, rows, variant }: TableSkeletonProps<T>) {
  const gridTemplateColumns = useGridTemplateColumns(columns);
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={TABLE_SHELL.row}
          style={{ gridTemplateColumns, height: `${ROW_HEIGHTS[variant]}px` }}
        >
          {columns.map(column => {
            const skeletonWidth = rowIndex % 3 === 0 ? '90%' : rowIndex % 3 === 1 ? '75%' : '85%';
            return (
              <div
                key={column.key}
                className={cn(
                  composedTableCell({
                    density: TABLE_CELL_DENSITY[variant],
                    tone: 'primary',
                    align: 'start',
                  }),
                  'min-w-0'
                )}
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

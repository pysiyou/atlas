/* eslint-disable react-refresh/only-export-components -- table building blocks */
import type { ReactNode } from 'react';
import { Icon } from '@/components/primitives';
import { Skeleton } from '@/components/feedback';
import { ICONS } from '@/config/icons';
import type {
  ColumnConfig,
  TableCellProps,
  TableHeaderProps,
  TableSkeletonProps,
  TableVariant,
} from './types';
import { PANEL, TABLE_SHELL, TABLE_TYPE } from '@/theme/recipes';
import { ROW_HEIGHTS, HEADER_PADDING } from './constants';
import { composedTableCell } from './columnHelpers';
import { useGridTemplateColumns } from '@/hooks/useTable';
import { cn } from '@/utils';

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
              column.headerClassName
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
        column.className
      )}
      role="cell"
    >
      <div className="min-w-0 flex-1 flex items-start justify-start">{children}</div>
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
  index: number;
  visibleColumns: ColumnConfig<T>[];
  variant: TableVariant;
  striped?: boolean;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
  gridTemplateColumns: string;
  ariaRowIndex?: number;
}

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
      data-clickable={isClickable ? 'true' : undefined}
      className={cn(tableRow.base, isClickable && tableRow.clickable, stripeClass, customRowClass)}
      style={{ gridTemplateColumns, height: `${ROW_HEIGHTS[variant]}px` }}
      onClick={() => onRowClick?.(item, index)}
    >
      {visibleColumns.map(column => (
        <TableCell key={column.key} column={column as ColumnConfig<unknown>} variant={variant}>
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

export const TABLE_ROW_OVERSCAN = 8;

export function resolveTableContainerClasses(embedded: boolean): string {
  return embedded ? 'flex flex-col flex-1 min-h-0' : `${PANEL.raisedShadowSm} flex flex-col h-full`;
}

export function resolveEmptyMinHeight(embedded: boolean, emptyVariant: 'compact' | 'dense'): string {
  if (embedded) return 'min-h-0';
  return emptyVariant === 'dense' ? 'min-h-[9rem]' : 'min-h-[12rem]';
}

/**
 * Visually hidden table name. A real `<caption>` is invalid inside `div role="table"`.
 */
function TableAccessibleName({ caption }: { caption?: string }) {
  if (!caption) return null;
  return <span className="sr-only">{caption}</span>;
}

export function TableViewLoading<T>({
  containerClasses,
  caption,
  ariaLabel,
  maxHeight,
  showHeader,
  columns,
  variant,
  loadingRows,
}: {
  containerClasses: string;
  caption?: string;
  ariaLabel?: string;
  maxHeight?: string;
  showHeader: boolean;
  columns: ColumnConfig<T>[];
  variant: TableVariant;
  loadingRows: number;
}) {
  return (
    <div
      className={containerClasses}
      role="table"
      aria-busy="true"
      aria-label={ariaLabel ?? caption ?? 'Loading'}
    >
      <TableAccessibleName caption={caption} />
      {showHeader && (
        <div className="shrink-0" role="rowgroup">
          <TableHeader
            columns={columns}
            visibleColumns={columns}
            sort={null}
            onSort={() => {}}
            variant={variant}
          />
        </div>
      )}
      <div
        className="flex-1 min-h-0 overflow-auto"
        style={maxHeight ? { maxHeight } : undefined}
        role="rowgroup"
      >
        <TableSkeleton columns={columns} rows={loadingRows} variant={variant} />
      </div>
    </div>
  );
}

export function TableViewEmpty({
  containerClasses,
  emptyMinHeight,
  emptyContent,
}: {
  containerClasses: string;
  emptyMinHeight: string;
  emptyContent: ReactNode;
}) {
  return (
    <div
      className={`${containerClasses} flex flex-1 items-center justify-center ${emptyMinHeight}`}
    >
      {emptyContent}
    </div>
  );
}

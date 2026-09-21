/**
 * TableView — presentational table body (header, rows, skeleton, empty).
 */

import { type ReactNode } from 'react';
import { EmptyState, Icon, Skeleton, type IconName } from '@/components';
import { ICONS } from '@/config/icons';
import { DEFAULT_EMPTY_TITLE, DEFAULT_EMPTY_DESCRIPTION } from '@/utils/constants';
import { getColumnStyle, useColumnStyles } from '@/hooks/useTable';
import type {
  ColumnConfig,
  SortConfig,
  TableBodyProps,
  TableCellProps,
  TableHeaderProps,
  TableSkeletonProps,
  TableVariant,
} from './types';
import { PANEL } from '@/components/theme/recipes';
import {
  CELL_PADDING,
  DEFAULT_LOADING_ROWS,
  HEADER_PADDING,
  ROW_HEIGHTS,
  TEXT_SIZE,
} from './constants';

export interface TableViewProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  sort: SortConfig | null;
  onSort: (key: string) => void;
  variant?: TableVariant;
  striped?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string;
  embedded?: boolean;
  showHeader?: boolean;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
  getRowKey?: (item: T, index: number) => string | number;
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: ReactNode;
  emptyDescription?: string;
  emptyIcon?: string;
  caption?: string;
  ariaLabel?: string;
  totalItems?: number;
}

function TableHeader<T>({
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
    >
      {visibleColumns.map(column => {
        const style = columnStyles.get(column.key) || {};
        const isSortable = column.sortable;
        const isActiveSort = sort?.key === column.key;
        return (
          <div
            key={column.key}
            className={`${HEADER_PADDING[variant]} text-xxs flex items-center justify-start gap-space-2 whitespace-nowrap ${isSortable ? 'cursor-pointer hover:bg-surface-hover select-none' : ''} ${isActiveSort ? 'text-text-primary bg-surface-selected' : ''} ${column.headerClassName || ''}`.trim()}
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

function TableCell({ column, children, variant }: TableCellProps) {
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

function TableRow<T>({
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
        const stripeClass = striped
          ? index % 2 === 0
            ? tableRow.stripedEven
            : tableRow.stripedOdd
          : '';
        return (
          <div
            key={rowKey}
            className={`${tableRow.base} ${isClickable ? `${tableRow.clickable} ${tableRow.hover}` : ''} ${stripeClass} ${rowClassName ? rowClassName(item, index) : ''}`}
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

function TableSkeleton<T = unknown>({ columns, rows, variant }: TableSkeletonProps<T>) {
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

/** Presentational table body — no sort/pagination logic */
export function TableView<T>({
  data,
  columns,
  sort,
  onSort,
  variant = 'default',
  striped = false,
  stickyHeader = false,
  maxHeight,
  embedded = false,
  showHeader = true,
  onRowClick,
  rowClassName,
  getRowKey,
  loading = false,
  loadingRows = DEFAULT_LOADING_ROWS,
  emptyMessage,
  emptyDescription,
  emptyIcon,
  caption,
  ariaLabel,
  totalItems,
}: TableViewProps<T>) {
  const containerClasses = embedded
    ? 'flex flex-col flex-1 min-h-0'
    : `${PANEL.raisedShadowSm} flex flex-col h-full`;

  if (loading) {
    return (
      <div className={containerClasses} role="table" aria-busy="true" aria-label={ariaLabel ?? 'Loading'}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <div className="flex-1 overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
          {showHeader && (
            <TableHeader
              columns={columns}
              visibleColumns={columns}
              sort={null}
              onSort={() => {}}
              variant={variant}
              sticky={stickyHeader}
            />
          )}
          <TableSkeleton columns={columns} rows={loadingRows} variant={variant} />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    const emptyContent =
      typeof emptyMessage === 'string' ? (
        <EmptyState
          variant="compact"
          fill
          icon={emptyIcon as IconName | undefined}
          title={emptyMessage}
          description={emptyDescription ?? DEFAULT_EMPTY_DESCRIPTION}
        />
      ) : (
        (emptyMessage ?? (
          <EmptyState
            variant="compact"
            fill
            icon={emptyIcon as IconName | undefined}
            title={DEFAULT_EMPTY_TITLE}
            description={emptyDescription ?? DEFAULT_EMPTY_DESCRIPTION}
          />
        ))
      );
    return (
      <div className={`${containerClasses} flex flex-1 items-center justify-center min-h-[12rem]`}>
        {emptyContent}
      </div>
    );
  }

  return (
    <div
      className={containerClasses}
      role="table"
      aria-label={ariaLabel}
      aria-rowcount={totalItems ?? data.length}
    >
      {caption && <caption className="sr-only">{caption}</caption>}
      <div className="flex-1 overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
        {showHeader && (
          <TableHeader
            columns={columns}
            visibleColumns={columns}
            sort={sort}
            onSort={onSort}
            variant={variant}
            sticky={stickyHeader}
          />
        )}
        <TableRow<T>
          data={data}
          visibleColumns={columns}
          variant={variant}
          striped={striped}
          onRowClick={onRowClick}
          rowClassName={rowClassName}
          getRowKey={getRowKey}
        />
      </div>
    </div>
  );
}

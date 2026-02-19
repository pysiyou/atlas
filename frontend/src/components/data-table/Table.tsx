/* eslint-disable max-lines */
/**
 * Data Table — single-file table with multi-view, sort, pagination.
 * Max-depth-1: all subcomponents (TableCore, TableHeader, TableRow, TableCell, TableSkeleton, CardGrid) in this file.
 */

import { useMemo, type ReactNode } from 'react';
import { useBreakpoint, isBreakpointAtMost, type Breakpoint } from '@/hooks/useBreakpoint';
import { useTableSort, useTablePagination, useColumnStyles, getColumnStyle } from '@/hooks/useTable';
import type {
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableCellProps,
  TableSkeletonProps,
  CardComponentProps,
  ColumnConfig,
  SortConfig,
  TableVariant,
} from '@/utils/table';
import {
  DEFAULT_LOADING_ROWS,
  ROW_HEIGHTS,
  CELL_PADDING,
  HEADER_PADDING,
  TEXT_SIZE,
} from '@/utils/table';
import { Pagination, EmptyState, Skeleton, Icon } from '@/components';
import type { IconName } from '@/components';
import { ICONS } from '@/utils';
import { DEFAULT_EMPTY_TITLE, DEFAULT_EMPTY_DESCRIPTION } from '@/utils/constants';

// Re-export types and constants for consumers
export type {
  TableProps,
  TableViewConfig,
  CardComponentProps,
  ColumnConfig,
  SortConfig,
  TableVariant,
  Breakpoint,
} from '@/utils/table';
export {
  createColumn,
  pickColumns,
  DEFAULT_LOADING_ROWS,
  SHOW_ALL_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL,
} from '@/utils/table';

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
      className={`flex items-stretch border-b border-border-default bg-surface-page flex items-center ${TEXT_SIZE[variant]} text-text-tertiary uppercase tracking-wider ${sticky ? 'sticky top-0 z-10' : ''}`}
    >
      {visibleColumns.map(column => {
        const style = columnStyles.get(column.key) || {};
        const isSortable = column.sortable;
        const isActiveSort = sort?.key === column.key;
        return (
          <div
            key={column.key}
            className={`${HEADER_PADDING[variant]} text-xxs flex items-center justify-start gap-2 whitespace-nowrap ${isSortable ? 'cursor-pointer hover:bg-neutral-100 select-none' : ''} ${isActiveSort ? 'text-text-primary bg-neutral-100' : ''} ${column.headerClassName || ''}`.trim()}
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
  stripedOdd: 'bg-neutral-50',
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

function TableSkeleton<T = unknown>({
  columns,
  rows,
  variant,
}: TableSkeletonProps<T>) {
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

interface CardGridProps<T> {
  data: T[];
  CardComponent: React.ComponentType<CardComponentProps<T>>;
  onRowClick?: (item: T, index: number) => void;
  getRowKey?: (item: T, index: number) => string | number;
}

function CardGrid<T>({ data, CardComponent, onRowClick, getRowKey }: CardGridProps<T>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

interface TableCoreProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  pagination?: import('@/utils/table').PaginationConfig | boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  defaultSort?: SortConfig;
  sort?: SortConfig | null;
  onSortChange?: (sort: SortConfig | null) => void;
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
  emptyIcon?: string;
  caption?: string;
  ariaLabel?: string;
}

function TableCore<T = Record<string, unknown>>({
  data,
  columns,
  pagination = true,
  initialPageSize,
  pageSizeOptions,
  defaultSort,
  sort: controlledSort,
  onSortChange,
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
  emptyIcon,
  caption,
  ariaLabel,
}: TableCoreProps<T>) {
  const paginationConfig = useMemo(() => {
    if (pagination === false) return undefined;
    if (typeof pagination === 'object') return pagination;
    return undefined;
  }, [pagination]);

  const { sortedData, sort, handleSort } = useTableSort({
    data,
    columns,
    defaultSort,
    controlledSort,
    onSortChange,
  });

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalItems,
    pageSizeOptions: effectivePageSizeOptions,
    setCurrentPage,
    setPageSize,
  } = useTablePagination({
    data: sortedData,
    externalPagination: paginationConfig,
    enabled: !!pagination,
    initialPageSize,
    pageSizeOptions,
  });

  const containerClasses = embedded
    ? 'flex flex-col flex-1 min-h-0'
    : 'bg-surface rounded-lg border border-border-default shadow-sm flex flex-col h-full';

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
          icon={(emptyIcon || ICONS.dataFields.document) as IconName}
          title={emptyMessage}
          description={DEFAULT_EMPTY_DESCRIPTION}
        />
      ) : (
        (emptyMessage ?? (
          <EmptyState
            icon={(emptyIcon || ICONS.dataFields.document) as IconName}
            title={DEFAULT_EMPTY_TITLE}
            description={DEFAULT_EMPTY_DESCRIPTION}
          />
        ))
      );
    return <div className={containerClasses}>{emptyContent}</div>;
  }

  return (
    <div
      className={containerClasses}
      role="table"
      aria-label={ariaLabel}
      aria-rowcount={totalItems}
    >
      {caption && <caption className="sr-only">{caption}</caption>}
      <div className="flex-1 overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
        {showHeader && (
          <TableHeader
            columns={columns}
            visibleColumns={columns}
            sort={sort}
            onSort={handleSort}
            variant={variant}
            sticky={stickyHeader}
          />
        )}
        <TableRow<T>
          data={paginatedData as T[]}
          visibleColumns={columns}
          variant={variant}
          striped={striped}
          onRowClick={onRowClick}
          rowClassName={rowClassName}
          getRowKey={getRowKey}
        />
      </div>
      {pagination && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={effectivePageSizeOptions}
        />
      )}
    </div>
  );
}

export function Table<T = Record<string, unknown>>({
  data,
  viewConfig,
  pagination = true,
  initialPageSize,
  pageSizeOptions,
  defaultSort,
  sort: controlledSort,
  onSortChange,
  breakpoint: overrideBreakpoint,
  variant = 'default',
  striped = false,
  stickyHeader = false,
  maxHeight,
  embedded = false,
  onRowClick,
  rowClassName,
  getRowKey,
  loading = false,
  loadingRows = DEFAULT_LOADING_ROWS,
  emptyMessage,
  emptyIcon,
  caption,
  ariaLabel,
}: TableProps<T>) {
  const detectedBreakpoint = useBreakpoint();
  const breakpoint: Breakpoint = overrideBreakpoint || detectedBreakpoint;

  const paginationConfig = useMemo(() => {
    if (pagination === false) return undefined;
    if (typeof pagination === 'object') return pagination;
    return undefined;
  }, [pagination]);

  const { sortedData } = useTableSort({
    data,
    columns: viewConfig.fullColumns,
    defaultSort,
    controlledSort,
    onSortChange,
  });

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalItems,
    pageSizeOptions: effectivePageSizeOptions,
    setCurrentPage,
    setPageSize,
  } = useTablePagination({
    data: sortedData,
    externalPagination: paginationConfig,
    enabled: !!pagination,
    initialPageSize,
    pageSizeOptions,
  });

  const shouldShowCard = useMemo(() => isBreakpointAtMost(breakpoint, 'sm'), [breakpoint]);
  const shouldShowCompact = useMemo(() => breakpoint === 'md', [breakpoint]);
  const shouldShowMedium = useMemo(() => breakpoint === 'lg', [breakpoint]);

  const wrapperClass =
    embedded
      ? 'flex flex-col h-full min-h-0'
      : 'bg-surface rounded-lg border border-border-default shadow-sm flex flex-col h-full min-h-0';

  if (shouldShowCard) {
    if (paginatedData.length === 0) {
      return (
        <div className={wrapperClass}>
          <TableCore<T>
            data={[]}
            columns={viewConfig.fullColumns}
            pagination={false}
            variant={variant}
            embedded={true}
            emptyMessage={emptyMessage}
            emptyIcon={emptyIcon}
          />
        </div>
      );
    }
    return (
      <div className={wrapperClass}>
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <CardGrid<T>
            data={paginatedData as T[]}
            CardComponent={viewConfig.CardComponent}
            onRowClick={onRowClick}
            getRowKey={getRowKey}
          />
        </div>
        {pagination && (
          <div className="shrink-0">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={effectivePageSizeOptions}
            />
          </div>
        )}
      </div>
    );
  }

  const activeColumns = shouldShowCompact
    ? viewConfig.compactColumns
    : shouldShowMedium
      ? viewConfig.mediumColumns
      : viewConfig.fullColumns;

  return (
    <div className={wrapperClass}>
      <TableCore<T>
        data={paginatedData as T[]}
        columns={activeColumns}
        pagination={false}
        defaultSort={defaultSort}
        sort={controlledSort}
        onSortChange={onSortChange}
        variant={variant}
        striped={striped}
        stickyHeader={stickyHeader}
        maxHeight={maxHeight}
        embedded={true}
        onRowClick={onRowClick}
        rowClassName={rowClassName}
        getRowKey={getRowKey}
        loading={loading}
        loadingRows={loadingRows}
        emptyMessage={emptyMessage}
        emptyIcon={emptyIcon}
        caption={caption}
        ariaLabel={ariaLabel}
      />
      {pagination && (
        <div className="shrink-0">
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={effectivePageSizeOptions}
          />
        </div>
      )}
    </div>
  );
}

export { CardGrid };

import { useMemo } from 'react';
import { useBreakpoint, isBreakpointAtMost, type Breakpoint } from '@/hooks/useBreakpoint';
import { Pagination } from '../navigation/Pagination';
import { CardGrid } from './CardGrid';
import { TableCore } from './TableCore';
import type { TableProps } from './types';
import { useTableSort } from './hooks/useTableSort';
import { useTablePagination } from './hooks/useTablePagination';
import { DEFAULT_LOADING_ROWS } from './constants';

/**
 * Main Table Component
 *
 * A fully-featured table component with:
 * - Multi-view configuration (full/medium/compact/card)
 * - Breakpoint-based view selection
 * - Sorting and pagination
 * - Loading and empty states
 *
 * Uses viewConfig to define separate views for different screen sizes:
 * - Card view (xs/sm): Custom CardComponent
 * - Compact table (md): compactColumns
 * - Medium table (lg): mediumColumns
 * - Full table (xl+): fullColumns
 */
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
  // Get current breakpoint (use override if provided for testing)
  const detectedBreakpoint = useBreakpoint();
  const breakpoint: Breakpoint = overrideBreakpoint || detectedBreakpoint;

  // Handle pagination config
  const paginationConfig = useMemo(() => {
    if (pagination === false) return undefined;
    if (typeof pagination === 'object') return pagination;
    return undefined; // Internal pagination will be used
  }, [pagination]);

  // Handle sorting - use fullColumns for sort key lookup since it contains all possible sortable columns
  const { sortedData } = useTableSort({
    data,
    columns: viewConfig.fullColumns,
    defaultSort,
    controlledSort,
    onSortChange,
  });

  // Handle pagination
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

  // Determine which view to show based on breakpoint
  const shouldShowCard = useMemo(() => {
    return isBreakpointAtMost(breakpoint, 'sm');
  }, [breakpoint]);

  const shouldShowCompact = useMemo(() => {
    return breakpoint === 'md';
  }, [breakpoint]);

  const shouldShowMedium = useMemo(() => {
    return breakpoint === 'lg';
  }, [breakpoint]);

  // Card view for mobile (xs/sm)
  if (shouldShowCard) {
    return (
      <div className={embedded ? 'flex flex-col h-full min-h-0' : 'bg-surface rounded-lg border border-border shadow-sm flex flex-col h-full min-h-0'}>
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <CardGrid<T>
            data={paginatedData as T[]}
            CardComponent={viewConfig.CardComponent}
            onRowClick={onRowClick}
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

  // Table view (compact, medium, or full)
  const activeColumns = shouldShowCompact
    ? viewConfig.compactColumns
    : shouldShowMedium
      ? viewConfig.mediumColumns
      : viewConfig.fullColumns;

  return (
    <TableCore<T>
      data={paginatedData as T[]}
      columns={activeColumns}
      pagination={pagination}
      initialPageSize={initialPageSize}
      pageSizeOptions={pageSizeOptions}
      defaultSort={defaultSort}
      sort={controlledSort}
      onSortChange={onSortChange}
      variant={variant}
      striped={striped}
      stickyHeader={stickyHeader}
      maxHeight={maxHeight}
      embedded={embedded}
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
  );
}

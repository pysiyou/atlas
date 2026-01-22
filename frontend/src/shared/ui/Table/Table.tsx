import { useMemo } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { Breakpoint } from '@/hooks/useBreakpoint';
import { Pagination } from '../Pagination';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { TableSkeleton } from './TableSkeleton';
import { TableEmpty } from './TableEmpty';
import { TableCardView } from './TableCardView';
import type { TableProps, ColumnConfig } from './types';
import { useColumnVisibility } from './hooks/useColumnVisibility';
import { useTableSort } from './hooks/useTableSort';
import { useTablePagination } from './hooks/useTablePagination';
import {
  DEFAULT_LOADING_ROWS,
  DEFAULT_CARD_VIEW_BREAKPOINT,
  DEFAULT_CARD_PRIORITY_FIELDS,
} from './constants';
import { isBreakpointAtMost } from '@/hooks/useBreakpoint';

/**
 * Main Table Component
 * 
 * A fully-featured table component with:
 * - Responsive column visibility
 * - Configurable column sizing
 * - Mobile card view fallback
 * - Sorting and pagination
 * - Loading and empty states
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Table<T = any>({
  data,
  columns,
  pagination = true,
  initialPageSize,
  pageSizeOptions,
  defaultSort,
  sort: controlledSort,
  onSortChange,
  breakpoint: overrideBreakpoint,
  enableCardView = true,
  cardViewBreakpoint = DEFAULT_CARD_VIEW_BREAKPOINT,
  cardPriorityFields = DEFAULT_CARD_PRIORITY_FIELDS,
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

  // Filter columns based on breakpoint
  const visibleColumns = useColumnVisibility(columns, breakpoint);

  // Determine if we should show card view
  const shouldShowCardView = useMemo(() => {
    if (!enableCardView) return false;
    return isBreakpointAtMost(breakpoint, cardViewBreakpoint);
  }, [enableCardView, breakpoint, cardViewBreakpoint]);

  // Handle pagination config
  const paginationConfig = useMemo(() => {
    if (pagination === false) return undefined;
    if (typeof pagination === 'object') return pagination;
    return undefined; // Internal pagination will be used
  }, [pagination]);

  // Handle sorting
  const { sortedData, sort, handleSort } = useTableSort({
    data,
    columns,
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

  // Loading state
  if (loading) {
    return (
      <div
        className={`flex flex-col h-full bg-white ${!embedded ? 'rounded border border-gray-200' : ''}`}
      >
        <div
          className="flex-1 overflow-auto"
          style={maxHeight ? { maxHeight } : undefined}
        >
          <TableHeader
            columns={columns}
            visibleColumns={visibleColumns}
            sort={null}
            onSort={() => {}}
            variant={variant}
            sticky={stickyHeader}
          />
          <TableSkeleton
            columns={visibleColumns as ColumnConfig<unknown>[]}
            rows={loadingRows}
            variant={variant}
          />
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div
        className={`flex flex-col h-full bg-white ${!embedded ? 'rounded border border-gray-200' : ''}`}
      >
        <TableEmpty message={emptyMessage} icon={emptyIcon} />
      </div>
    );
  }

  // Card view for mobile
  if (shouldShowCardView) {
    return (
      <div
        className={`flex flex-col h-full ${!embedded ? 'rounded border border-gray-200' : ''}`}
      >
        <div className="p-4">
          <TableCardView<T>
            data={paginatedData as T[]}
            columns={columns}
            priorityFields={cardPriorityFields}
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

  // Standard table view
  return (
    <div
      className={`flex flex-col h-full bg-white ${!embedded ? 'rounded border border-gray-200' : ''}`}
      role="table"
      aria-label={ariaLabel}
      aria-rowcount={totalItems}
    >
      {caption && <caption className="sr-only">{caption}</caption>}
      
      {/* Scrollable table area */}
      <div
        className="flex-1 overflow-auto"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <TableHeader
          columns={columns}
          visibleColumns={visibleColumns}
          sort={sort}
          onSort={handleSort}
          variant={variant}
          sticky={stickyHeader}
        />
        <TableRow<T>
          data={paginatedData as T[]}
          visibleColumns={visibleColumns}
          variant={variant}
          striped={striped}
          onRowClick={onRowClick}
          rowClassName={rowClassName}
          getRowKey={getRowKey}
        />
      </div>

      {/* Pagination */}
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

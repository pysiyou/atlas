import { useMemo, type ReactNode } from 'react';
import { Pagination } from '../navigation/Pagination';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { TableSkeleton } from './TableSkeleton';
import { EmptyState } from '../display/EmptyState';
import type { IconName } from '../display/Icon';
import type { ColumnConfig, SortConfig, PaginationConfig, TableVariant } from './types';
import { ICONS } from '@/utils';
import { useTableSort } from './hooks/useTableSort';
import { useTablePagination } from './hooks/useTablePagination';
import { DEFAULT_LOADING_ROWS } from './constants';

/**
 * Props for TableCore component
 */
interface TableCoreProps<T> {
  /** Array of data items to display */
  data: T[];
  /** Column definitions */
  columns: ColumnConfig<T>[];

  // === Pagination ===
  /** External pagination control (if not provided, internal pagination is used) */
  pagination?: PaginationConfig | boolean;
  /** Initial page size for internal pagination */
  initialPageSize?: number;
  /** Page size options for internal pagination */
  pageSizeOptions?: number[];

  // === Sorting ===
  /** Default sort configuration */
  defaultSort?: SortConfig;
  /** Controlled sort state */
  sort?: SortConfig | null;
  /** Sort change handler for controlled mode */
  onSortChange?: (sort: SortConfig | null) => void;

  // === Visual Options ===
  /** Table density variant */
  variant?: TableVariant;
  /** Show alternating row backgrounds */
  striped?: boolean;
  /** Sticky header on scroll */
  stickyHeader?: boolean;
  /** Maximum height (enables vertical scroll) */
  maxHeight?: string;
  /** Embedded mode (removes outer border/rounded corners) */
  embedded?: boolean;

  // === Interactions ===
  /** Row click handler */
  onRowClick?: (item: T, index: number) => void;
  /** Dynamic row CSS classes */
  rowClassName?: (item: T, index: number) => string;
  /** Row key extractor (default: uses index) */
  getRowKey?: (item: T, index: number) => string | number;

  // === States ===
  /** Loading state */
  loading?: boolean;
  /** Number of skeleton rows to show while loading */
  loadingRows?: number;
  /** Empty state message */
  emptyMessage?: ReactNode;
  /** Empty state icon name */
  emptyIcon?: string;

  // === Accessibility ===
  /** Table caption for screen readers */
  caption?: string;
  /** aria-label for the table */
  ariaLabel?: string;
}

/**
 * TableCore Component
 *
 * Shared table rendering logic used by both full and compact views.
 * Handles sorting, pagination, loading/empty states, and renders the table structure.
 *
 * @param data - Array of data items to display
 * @param columns - Column definitions for the table
 * @param pagination - Pagination configuration
 * @param sort - Sort configuration
 * @param variant - Table density variant
 * @param loading - Loading state
 * @param emptyMessage - Empty state message
 * @param onRowClick - Row click handler
 * @param getRowKey - Row key extractor
 * @param ...rest - Additional table props
 */
export function TableCore<T = Record<string, unknown>>({
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

  const containerClasses = embedded 
    ? 'flex flex-col h-full' 
    : 'bg-surface rounded-lg border border-border shadow-sm flex flex-col h-full';

  // Loading state
  if (loading) {
    return (
      <div className={containerClasses}>
        <div className="flex-1 overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
          <TableHeader
            columns={columns}
            visibleColumns={columns}
            sort={null}
            onSort={() => {}}
            variant={variant}
            sticky={stickyHeader}
          />
          <TableSkeleton
            columns={columns as ColumnConfig<unknown>[]}
            rows={loadingRows}
            variant={variant}
          />
        </div>
      </div>
    );
  }

  // Empty state – use EmptyState for consistent visuals; normalize string to EmptyState
  if (data.length === 0) {
    const emptyContent =
      typeof emptyMessage === 'string' ? (
        <EmptyState
          icon={(emptyIcon || ICONS.dataFields.document) as IconName}
          title={emptyMessage}
          description="Try adjusting filters or add new items."
        />
      ) : (
        emptyMessage ?? (
          <EmptyState
            icon={(emptyIcon || ICONS.dataFields.document) as IconName}
            title="No data available"
            description="Try adjusting filters or add new items."
          />
        )
      );
    return <div className={containerClasses}>{emptyContent}</div>;
  }

  // Standard table view
  return (
    <div
      className={containerClasses}
      role="table"
      aria-label={ariaLabel}
      aria-rowcount={totalItems}
    >
      {caption && <caption className="sr-only">{caption}</caption>}

      {/* Scrollable table area */}
      <div className="flex-1 overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
        <TableHeader
          columns={columns}
          visibleColumns={columns}
          sort={sort}
          onSort={handleSort}
          variant={variant}
          sticky={stickyHeader}
        />
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

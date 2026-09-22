/**
 * Headless data-table hook — single owner for sort → paginate pipeline.
 */

import { useMemo } from 'react';
import type { ColumnConfig, PaginationConfig, SortConfig } from '@/utils/table';
import { resolvePaginationConfig, isPaginationEnabled } from '@/utils/table';
import { useTableSort, useTablePagination } from '@/hooks/useTable';

export interface UseDataTableOptions<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  pagination?: PaginationConfig | boolean | import('@/utils/table').ListViewPaginationConfig;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  defaultSort?: SortConfig;
  sort?: SortConfig | null;
  onSortChange?: (sort: SortConfig | null) => void;
}

export function useDataTable<T>({
  data,
  columns,
  pagination = true,
  initialPageSize,
  pageSizeOptions,
  defaultSort,
  sort: controlledSort,
  onSortChange,
}: UseDataTableOptions<T>) {
  const paginationEnabled = isPaginationEnabled(pagination);
  const externalPagination = useMemo(() => resolvePaginationConfig(pagination), [pagination]);

  const clientPageSize = useMemo(() => {
    if (typeof pagination === 'object' && pagination !== null && 'mode' in pagination) {
      if (pagination.mode === 'client') return pagination.pageSize;
    }
    return initialPageSize;
  }, [pagination, initialPageSize]);

  const clientPageSizeOptions = useMemo(() => {
    if (typeof pagination === 'object' && pagination !== null && 'mode' in pagination) {
      if (pagination.mode === 'client') return pagination.pageSizeOptions;
    }
    return pageSizeOptions;
  }, [pagination, pageSizeOptions]);

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
    totalPages,
    pageSizeOptions: effectivePageSizeOptions,
    setCurrentPage,
    setPageSize,
    isExternallyControlled,
  } = useTablePagination({
    data: sortedData,
    externalPagination: externalPagination || undefined,
    enabled: paginationEnabled,
    initialPageSize: clientPageSize,
    pageSizeOptions: clientPageSizeOptions,
  });

  return {
    rows: paginatedData,
    sort,
    handleSort,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    pageSizeOptions: effectivePageSizeOptions,
    setCurrentPage,
    setPageSize,
    isExternallyControlled,
    paginationEnabled,
  };
}

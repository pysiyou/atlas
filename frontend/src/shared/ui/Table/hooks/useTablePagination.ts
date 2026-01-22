import { useState, useMemo, useCallback } from 'react';
import type { PaginationConfig } from '../types';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from '../constants';

interface UseTablePaginationOptions<T> {
  data: T[];
  externalPagination?: PaginationConfig;
  enabled?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

interface UseTablePaginationResult<T> {
  paginatedData: T[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  pageSizeOptions: number[];
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  isExternallyControlled: boolean;
}

/**
 * Hook to manage table pagination
 * Supports both internal and external (server-side) pagination
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useTablePagination = <T = any>({
  data,
  externalPagination,
  enabled = true,
  initialPageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: UseTablePaginationOptions<T>): UseTablePaginationResult<T> => {
  // Internal state for client-side pagination
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(initialPageSize);

  const isExternallyControlled = !!externalPagination;

  const pageSize = isExternallyControlled
    ? externalPagination.pageSize
    : internalPageSize;
  const totalItems = isExternallyControlled
    ? externalPagination.totalItems
    : data.length;

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Compute effective internal page - reset to 1 if out of bounds
  // This avoids setState in effect which causes cascading renders
  const effectiveInternalPage = useMemo(() => {
    if (!isExternallyControlled && internalPage > totalPages && totalPages > 0) {
      return 1;
    }
    return internalPage;
  }, [internalPage, totalPages, isExternallyControlled]);

  // Use external values if provided
  const currentPage = isExternallyControlled
    ? externalPagination.currentPage
    : effectiveInternalPage;

  /**
   * Set current page
   */
  const setCurrentPage = useCallback(
    (page: number) => {
      if (isExternallyControlled) {
        externalPagination.onPageChange(page);
      } else {
        setInternalPage(page);
      }
    },
    [isExternallyControlled, externalPagination]
  );

  /**
   * Set page size
   */
  const setPageSize = useCallback(
    (size: number) => {
      if (isExternallyControlled) {
        externalPagination.onPageSizeChange?.(size);
      } else {
        setInternalPageSize(size);
        setInternalPage(1); // Reset to first page
      }
    },
    [isExternallyControlled, externalPagination]
  );

  /**
   * Paginate data for client-side pagination
   */
  const paginatedData = useMemo(() => {
    if (!enabled || isExternallyControlled) {
      return data;
    }

    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, enabled, isExternallyControlled, currentPage, pageSize]);

  return {
    paginatedData,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    pageSizeOptions: externalPagination?.pageSizeOptions || pageSizeOptions,
    setCurrentPage,
    setPageSize,
    isExternallyControlled,
  };
};

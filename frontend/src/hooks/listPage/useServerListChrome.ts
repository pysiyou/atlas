import { useMemo } from 'react';
import type { FeedbackId } from '@/config/feedbackCatalog';
import { buildServerListPagination } from './buildServerListPagination';
import { toListLoadError, type ListLoadError } from './toListLoadError';
import { useFilterChangeWithPageReset } from './useFilterChangeWithPageReset';
import type { ListViewPaginationConfig } from '@/components/data-table';

export interface UseServerListChromeOptions {
  setFilter: (key: string, value: unknown) => void;
  resetPage: () => void;
  loadFailedKey: FeedbackId;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  page: number;
  pagination: { pageSize: number; total: number };
  goToPage: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  /** When set, overrides `isLoading` for ListView (e.g. joined secondary queries). */
  loading?: boolean;
}

export interface UseServerListChromeReturn {
  loading: boolean;
  error: ListLoadError | null;
  listPagination: ListViewPaginationConfig;
  setFilterAndReset: (key: string, value: unknown) => void;
  onRetry: () => void;
}

/** Shared ListView wiring for server-paginated list pages. */
export function useServerListChrome({
  setFilter,
  resetPage,
  loadFailedKey,
  isLoading,
  isError,
  error: queryError,
  refetch,
  page,
  pagination,
  goToPage,
  pageSizeOptions,
  onPageSizeChange,
  loading: loadingOverride,
}: UseServerListChromeOptions): UseServerListChromeReturn {
  const { setFilterAndReset } = useFilterChangeWithPageReset(setFilter, resetPage);

  const loading = loadingOverride ?? isLoading;

  const error = isError ? toListLoadError(loadFailedKey, queryError) : null;

  const listPagination = useMemo(
    () =>
      buildServerListPagination({
        page,
        pagination,
        goToPage,
        pageSizeOptions,
        onPageSizeChange,
      }),
    [page, pagination, goToPage, pageSizeOptions, onPageSizeChange],
  );

  return {
    loading,
    error,
    listPagination,
    setFilterAndReset,
    onRetry: refetch,
  };
}

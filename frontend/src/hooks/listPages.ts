/** List page chrome, pagination helpers, and load-error toasts. */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { FeedbackId } from '@/types/generated/feedback';
import type { ListViewPaginationConfig } from '@/components/data-table';
import { notify } from '@/feedback';

export interface ListPageChromeProps {
  loading?: boolean;
}

export type ListPageServerPagination = ListViewPaginationConfig & { mode: 'server' };

export interface BuildServerListPaginationParams {
  page: number;
  pagination: { pageSize: number; total: number };
  goToPage: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

export function buildServerListPagination({
  page,
  pagination,
  goToPage,
  pageSizeOptions,
  onPageSizeChange,
}: BuildServerListPaginationParams): ListViewPaginationConfig {
  return {
    mode: 'server',
    currentPage: page,
    pageSize: pagination.pageSize,
    totalItems: pagination.total,
    onPageChange: goToPage,
    onPageSizeChange,
    pageSizeOptions,
  };
}

export function useListLoadErrorToast(
  loadFailedKey: FeedbackId,
  isError: boolean,
  queryError: unknown,
  refetch: () => void
): void {
  const lastNotifiedRef = useRef<unknown>(null);

  useEffect(() => {
    if (!isError || queryError == null) {
      lastNotifiedRef.current = null;
      return;
    }
    if (lastNotifiedRef.current === queryError) return;
    lastNotifiedRef.current = queryError;
    notify.show(loadFailedKey, { error: queryError });
  }, [isError, queryError, loadFailedKey, refetch]);
}

type SetFilter = (key: string, value: unknown) => void;

export function useFilterChangeWithPageReset(setFilter: SetFilter, resetPage: () => void) {
  const setFilterAndReset = useCallback(
    (key: string, value: unknown) => {
      setFilter(key, value);
      resetPage();
    },
    [setFilter, resetPage]
  );

  return { setFilterAndReset };
}

export interface UseClientListChromeOptions {
  loadFailedKey: FeedbackId;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

export interface UseClientListChromeReturn {
  loading: boolean;
  onRetry: () => void;
}

export function useClientListChrome({
  loadFailedKey,
  isLoading,
  isError,
  error: queryError,
  refetch,
}: UseClientListChromeOptions): UseClientListChromeReturn {
  useListLoadErrorToast(loadFailedKey, isError, queryError, refetch);

  return {
    loading: isLoading,
    onRetry: refetch,
  };
}

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
  loading?: boolean;
}

export interface UseServerListChromeReturn {
  loading: boolean;
  listPagination: ListViewPaginationConfig;
  setFilterAndReset: (key: string, value: unknown) => void;
  onRetry: () => void;
}

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

  useListLoadErrorToast(loadFailedKey, isError, queryError, refetch);

  const listPagination = useMemo(
    () =>
      buildServerListPagination({
        page,
        pagination,
        goToPage,
        pageSizeOptions,
        onPageSizeChange,
      }),
    [page, pagination, goToPage, pageSizeOptions, onPageSizeChange]
  );

  return {
    loading,
    listPagination,
    setFilterAndReset,
    onRetry: refetch,
  };
}
/**
 * Lab worklist API service — server-paginated queues.
 */
import { apiClient } from '@/lib/api/client';
import type {
  CollectionWorklistItem,
  DashboardWorklistItem,
  EntryWorklistItem,
  ValidationWorklistItem,
  WorklistPagination,
} from '@/types/labWorklist';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { queryKeys, cacheConfig, useAuthQueryEnabled } from '@/lib/query';
import { usePaginatedPageSize } from '@/hooks/usePaginatedPageSize';
import { LAB_PATHS } from '../constants/labConstants';

/** Default server page size for lab queues (backend max is 200). */
export const WORKLIST_PAGE_SIZE = 50;

export type {
  CollectionWorklistItem,
  DashboardWorklistItem,
  EntryWorklistItem,
  LabWorklistAllowedActions,
  ValidationWorklistItem,
  WorklistPagination,
} from '@/types/labWorklist';

interface WorklistParams {
  page?: number;
  pageSize?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sampleType?: string;
  status?: string;
  priority?: string;
}

function buildParams(params?: WorklistParams): Record<string, string> {
  const q: Record<string, string> = {};
  if (params?.page != null) q.page = String(params.page);
  if (params?.pageSize != null) q.pageSize = String(params.pageSize);
  if (params?.search) q.search = params.search;
  if (params?.dateFrom) q.dateFrom = params.dateFrom;
  if (params?.dateTo) q.dateTo = params.dateTo;
  if (params?.sampleType) q.sampleType = params.sampleType;
  if (params?.status) q.status = params.status;
  if (params?.priority) q.priority = params.priority;
  return q;
}

export const worklistsAPI = {
  getCollection(params?: WorklistParams) {
    return apiClient.get<{ items: CollectionWorklistItem[]; pagination: WorklistPagination }>(
      LAB_PATHS.worklists.collection,
      buildParams(params)
    );
  },

  getEntry(params?: WorklistParams) {
    return apiClient.get<{ items: EntryWorklistItem[]; pagination: WorklistPagination }>(
      LAB_PATHS.worklists.entry,
      buildParams(params)
    );
  },

  getValidation(params?: WorklistParams) {
    return apiClient.get<{ items: ValidationWorklistItem[]; pagination: WorklistPagination }>(
      LAB_PATHS.worklists.validation,
      buildParams(params)
    );
  },

  getDashboardToday(params?: WorklistParams) {
    return apiClient.get<{ items: DashboardWorklistItem[]; pagination: WorklistPagination }>(
      LAB_PATHS.worklists.dashboardToday,
      buildParams(params)
    );
  },

  getAllTests(params?: WorklistParams) {
    return apiClient.get<{ items: DashboardWorklistItem[]; pagination: WorklistPagination }>(
      LAB_PATHS.worklists.allTests,
      buildParams(params)
    );
  },
};

/**
 * Lab worklist React Query hooks.
 */

interface WorklistHookParams {
  page?: number;
  pageSize?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sampleType?: string;
  status?: string;
  priority?: string;
}

type WorklistQueryKeyFn = (params?: WorklistHookParams) => readonly unknown[];

function createWorklistQueryHook<TItem>(
  queryKeyFn: WorklistQueryKeyFn,
  fetchFn: (params?: WorklistHookParams) => Promise<{ items: TItem[]; pagination?: WorklistPagination }>,
) {
  return function useWorklistQuery(params?: WorklistHookParams) {
    const enabled = useAuthQueryEnabled();
    const initialPageSize = params?.pageSize ?? WORKLIST_PAGE_SIZE;
    const { pageSize, setPageSize: setPageSizeState } = usePaginatedPageSize(initialPageSize);
    const [page, setPage] = useState(params?.page ?? 1);
    const filterSnapshot = JSON.stringify({
      search: params?.search ?? null,
      dateFrom: params?.dateFrom ?? null,
      dateTo: params?.dateTo ?? null,
      sampleType: params?.sampleType ?? null,
      status: params?.status ?? null,
      priority: params?.priority ?? null,
    });

    useEffect(() => {
      setPage(1);
    }, [filterSnapshot]);

    const setPageSize = useCallback(
      (size: number) => {
        setPageSizeState(size);
        setPage(1);
      },
      [setPageSizeState]
    );

    const queryParams: WorklistHookParams = {
      ...params,
      page,
      pageSize,
    };
    const query = useQuery({
      queryKey: queryKeyFn(queryParams),
      queryFn: () => fetchFn(queryParams),
      enabled,
      placeholderData: keepPreviousData,
      ...cacheConfig.dynamic,
    });

    const goToPage = useCallback((nextPage: number) => {
      setPage(nextPage);
    }, []);

    const pagination = query.data?.pagination;

    return {
      items: query.data?.items ?? [],
      pagination: pagination
        ? { ...pagination, page, pageSize, total: pagination.total }
        : { page, pageSize, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      refetch: query.refetch,
      page,
      goToPage,
      setPageSize,
    };
  };
}

export const useCollectionWorklist = createWorklistQueryHook(
  queryKeys.worklists.collection,
  worklistsAPI.getCollection,
);

export const useEntryWorklist = createWorklistQueryHook(
  queryKeys.worklists.entry,
  worklistsAPI.getEntry,
);

export const useValidationWorklist = createWorklistQueryHook(
  queryKeys.worklists.validation,
  worklistsAPI.getValidation,
);

export const useDashboardWorklistToday = createWorklistQueryHook(
  queryKeys.worklists.dashboardToday,
  worklistsAPI.getDashboardToday,
);

export const useAllTestsWorklist = createWorklistQueryHook(
  queryKeys.worklists.allTests,
  worklistsAPI.getAllTests,
);

/**
 * Lab worklist React Query hooks.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/store';
import { queryKeys, cacheConfig } from '@/lib/query';
import { LAB_CONFIG } from '@/features/lab/constants';
import { worklistsAPI } from './worklists.service';

export { worklistsAPI } from './worklists.service';
export type {
  CollectionWorklistItem,
  EntryWorklistItem,
  ValidationWorklistItem,
  LabBoardResponse,
} from './worklists.service';

interface WorklistHookParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export function useCollectionWorklist(params?: WorklistHookParams) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const query = useQuery({
    queryKey: queryKeys.worklists.collection(params),
    queryFn: () => worklistsAPI.getCollection({ pageSize: 200, ...params }),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
    refetchInterval: LAB_CONFIG.TAB_COUNT_REFRESH_MS,
  });
  return {
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useEntryWorklist(params?: WorklistHookParams) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const query = useQuery({
    queryKey: queryKeys.worklists.entry(params),
    queryFn: () => worklistsAPI.getEntry({ pageSize: 200, ...params }),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
    refetchInterval: LAB_CONFIG.TAB_COUNT_REFRESH_MS,
  });
  return {
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useValidationWorklist(params?: WorklistHookParams) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const query = useQuery({
    queryKey: queryKeys.worklists.validation(params),
    queryFn: () => worklistsAPI.getValidation({ pageSize: 200, ...params }),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
    refetchInterval: LAB_CONFIG.TAB_COUNT_REFRESH_MS,
  });
  return {
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useLabBoard() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const query = useQuery({
    queryKey: queryKeys.commandCenter.board(),
    queryFn: () => worklistsAPI.getBoard(),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
    refetchInterval: LAB_CONFIG.TAB_COUNT_REFRESH_MS,
  });
  return {
    board: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    dataUpdatedAt: query.dataUpdatedAt,
  };
}

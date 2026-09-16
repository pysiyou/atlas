/**
 * Lab worklist React Query hooks.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/authStore';
import { queryKeys, cacheConfig } from '@/lib/query';
import { LAB_CONFIG } from '@/features/lab/constants';
import { worklistsAPI } from './worklists.service';

export { worklistsAPI } from './worklists.service';
export type {
  CollectionWorklistItem,
  EntryWorklistItem,
  ValidationWorklistItem,
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

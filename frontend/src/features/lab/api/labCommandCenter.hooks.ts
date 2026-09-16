/**
 * Command Center React Query hooks.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/authStore';
import { queryKeys, cacheConfig } from '@/lib/query';
import { LAB_CONFIG } from '@/features/lab/constants';
import { labCommandCenterAPI } from './labCommandCenter.service';

export function useLabCommandCenterQuery() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const query = useQuery({
    queryKey: queryKeys.commandCenter.board(),
    queryFn: () => labCommandCenterAPI.getCommandCenterBoard(),
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

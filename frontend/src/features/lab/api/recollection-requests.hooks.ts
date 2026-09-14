/**
 * Recollection requests API hooks — React Query layer.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/query';
import { useAuthStore } from '@/app/store';
import { invalidateRecollectionQueries, invalidateOrderQueries } from '@/lib/query/invalidate';
import { recollectionRequestsAPI } from './recollection-requests.service';

export { recollectionRequestsAPI } from './recollection-requests.service';

export interface LabQueryRefetchOptions {
  refetchInterval?: number;
}

export function usePendingRecollectionRequests(refetchOptions?: LabQueryRefetchOptions) {
  const { isAuthenticated, isLoading: isRestoring, hasRole } = useAuthStore();
  const canReview = hasRole(['administrator', 'lab-technician-plus']);

  const query = useQuery({
    queryKey: queryKeys.recollectionRequests.pending(),
    queryFn: () => recollectionRequestsAPI.listPending(),
    enabled: isAuthenticated && !isRestoring && canReview,
    ...cacheConfig.dynamic,
    refetchInterval: refetchOptions?.refetchInterval ?? 15_000,
  });

  return {
    requests: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useApproveRecollectionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, reviewNotes }: { requestId: number; reviewNotes?: string }) =>
      recollectionRequestsAPI.approve(requestId, reviewNotes),
    onSuccess: () => {
      invalidateRecollectionQueries(queryClient);
      invalidateOrderQueries(queryClient, { samples: true });
    },
  });
}

export function useDenyRecollectionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, reviewNotes }: { requestId: number; reviewNotes?: string }) =>
      recollectionRequestsAPI.deny(requestId, reviewNotes),
    onSuccess: () => {
      invalidateRecollectionQueries(queryClient);
      invalidateOrderQueries(queryClient, { samples: true });
    },
  });
}

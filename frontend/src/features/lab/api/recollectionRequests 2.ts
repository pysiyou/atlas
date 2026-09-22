/**
 * Recollection requests API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import type { ApiRecollectionRequestResult, ApiRecollectionRequestSummary } from '@/lib/api/types';
import type { RecollectionRequestResult, RecollectionRequestSummary } from '@/types/lab-operations';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/query';
import { useAuthStore } from '@/app/authStore';
import { invalidateRecollectionQueries, invalidateOrderQueries } from '@/lib/query/invalidate';

export const recollectionRequestsAPI = {
  listPending(): Promise<RecollectionRequestSummary[]> {
    return apiClient.get<ApiRecollectionRequestSummary[]>(
      '/lab/recollection-requests/pending'
    ) as Promise<RecollectionRequestSummary[]>;
  },

  approve(requestId: number, reviewNotes?: string): Promise<RecollectionRequestResult> {
    return apiClient.post<ApiRecollectionRequestResult>(
      `/lab/recollection-requests/${requestId}/approve`,
      { reviewNotes }
    ) as Promise<RecollectionRequestResult>;
  },

  deny(requestId: number, reviewNotes?: string): Promise<RecollectionRequestResult> {
    return apiClient.post<ApiRecollectionRequestResult>(
      `/lab/recollection-requests/${requestId}/deny`,
      { reviewNotes }
    ) as Promise<RecollectionRequestResult>;
  },
};

/**
 * Recollection requests API hooks — React Query layer.
 */

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
    onSuccess: async () => {
      await Promise.all([
        invalidateRecollectionQueries(queryClient),
        invalidateOrderQueries(queryClient, { samples: true }),
      ]);
    },
  });
}

export function useDenyRecollectionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, reviewNotes }: { requestId: number; reviewNotes?: string }) =>
      recollectionRequestsAPI.deny(requestId, reviewNotes),
    onSuccess: async () => {
      await Promise.all([
        invalidateRecollectionQueries(queryClient),
        invalidateOrderQueries(queryClient, { samples: true }),
      ]);
    },
  });
}

/**
 * Recollection requests API — supervisor-gated patient redraw.
 */
import { apiClient } from '@/lib/apiClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/query';
import { useAuthStore } from '@/app/store';
import { invalidateOrderQueries } from '@/lib/query/invalidate';
import type {
  RecollectionRequestResult,
  RecollectionRequestSummary,
} from '@/types/lab-operations';

export const recollectionRequestsAPI = {
  listPending(): Promise<RecollectionRequestSummary[]> {
    return apiClient.get<RecollectionRequestSummary[]>('/lab/recollection-requests/pending');
  },

  approve(requestId: number, reviewNotes?: string): Promise<RecollectionRequestResult> {
    return apiClient.post<RecollectionRequestResult>(
      `/lab/recollection-requests/${requestId}/approve`,
      { reviewNotes }
    );
  },

  deny(requestId: number, reviewNotes?: string): Promise<RecollectionRequestResult> {
    return apiClient.post<RecollectionRequestResult>(
      `/lab/recollection-requests/${requestId}/deny`,
      { reviewNotes }
    );
  },
};

export function usePendingRecollectionRequests() {
  const { isAuthenticated, isLoading: isRestoring, hasRole } = useAuthStore();
  const canReview = hasRole(['administrator', 'lab-technician-plus']);

  const query = useQuery({
    queryKey: queryKeys.recollectionRequests.pending(),
    queryFn: () => recollectionRequestsAPI.listPending(),
    enabled: isAuthenticated && !isRestoring && canReview,
    ...cacheConfig.dynamic,
    refetchInterval: 15_000,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.recollectionRequests.all });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.recollectionRequests.all });
      invalidateOrderQueries(queryClient, { samples: true });
    },
  });
}

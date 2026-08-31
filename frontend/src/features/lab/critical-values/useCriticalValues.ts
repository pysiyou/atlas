/**
 * Critical values query and mutation hooks.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/store';
import {
  criticalValuesAPI,
  type AcknowledgeCriticalValueRequest,
  type NotifyCriticalValueRequest,
} from './criticalValues.api';
import { queryKeys } from '@/lib/query';

export function usePendingCriticalValues() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.criticalValues.pending(),
    queryFn: () => criticalValuesAPI.getPending(),
    enabled: isAuthenticated && !isRestoring,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return {
    criticalValues: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useNotifyCriticalValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ testId, body }: { testId: number; body: NotifyCriticalValueRequest }) =>
      criticalValuesAPI.notify(testId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.criticalValues.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

export function useAcknowledgeCriticalValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ testId, body }: { testId: number; body: AcknowledgeCriticalValueRequest }) =>
      criticalValuesAPI.acknowledge(testId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.criticalValues.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

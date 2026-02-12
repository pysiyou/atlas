/**
 * Pending Escalation Query Hook
 *
 * Fetches tests pending escalation resolution (admin/labtech_plus only).
 * Uses GET /results/pending-escalation for role-gated data.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/query';
import { resultAPI } from '@/services/api/results';
import { useAuthStore } from '@/shared/stores/auth.store';
import type { PendingEscalationItem } from '@/types/lab-operations';

export function usePendingEscalation() {
  const { isAuthenticated, isLoading: isRestoring, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);

  const query = useQuery({
    queryKey: queryKeys.results.pendingEscalation(),
    queryFn: () => resultAPI.getPendingEscalation(),
    enabled: isAuthenticated && !isRestoring && canResolveEscalation,
    ...cacheConfig.dynamic,
  });

  const invalidatePendingEscalation = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.results.pendingEscalation() });
  };

  return {
    escalatedTests: (query.data ?? []) as PendingEscalationItem[],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidatePendingEscalation,
  };
}

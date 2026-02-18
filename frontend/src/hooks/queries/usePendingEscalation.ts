/**
 * Pending Escalation Query Hook
 *
 * Fetches tests pending escalation resolution (admin/labtech_plus only).
 * Uses GET /results/pending-escalation for role-gated data.
 * Returns TestWithContext[] — the canonical superset type for all lab workflow views.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/query';
import { resultAPI } from '@/services/api/results';
import { useAuthStore } from '@/shared/stores/auth.store';
import type { TestWithContext } from '@/types';

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
    escalatedTests: (query.data ?? []) as TestWithContext[],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidatePendingEscalation,
  };
}

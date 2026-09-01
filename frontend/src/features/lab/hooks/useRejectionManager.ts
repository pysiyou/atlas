/**
 * useRejectionManager — fetch options and reject resulted tests.
 * The backend decides re-test vs auto-escalation; no action type from the client.
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resultAPI, useRejectResults } from '@/features/lab/validation/results.api';
import { getErrorMessage } from '@/utils/errors';
import { logger } from '@/utils/logger';
import type { RejectionOptionsResponse, RejectionResult } from '@/types/lab-operations';

interface UseRejectionManagerProps {
  orderId: string | number;
  testCode: string;
  autoFetch?: boolean;
}

export function useRejectionManager({
  orderId,
  testCode,
  autoFetch = false,
}: UseRejectionManagerProps) {
  const rejectMutation = useRejectResults();
  const [actionError, setActionError] = useState<string | null>(null);

  const isMissing = (id: string | number | null | undefined, code: string | null | undefined) =>
    id == null || id === '' || code == null || code === '';

  const fetcher = useCallback(async (): Promise<RejectionOptionsResponse> => {
    const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
    return resultAPI.getRejectionOptions(orderIdStr, testCode);
  }, [orderId, testCode]);

  const {
    data: options = null,
    isLoading,
    error: fetchError,
    refetch: fetchOptionsQuery,
  } = useQuery({
    queryKey: ['rejection-options', orderId, testCode],
    queryFn: fetcher,
    enabled: autoFetch && !isMissing(orderId, testCode),
    retry: false,
  });

  const fetchOptions = useCallback(async () => {
    await fetchOptionsQuery();
  }, [fetchOptionsQuery]);

  const rejectWithReason = useCallback(
    async (reason: string, notes?: string): Promise<RejectionResult | null> => {
      if (isMissing(orderId, testCode)) {
        setActionError('Order ID and test code are required');
        return null;
      }

      setActionError(null);

      try {
        return await rejectMutation.mutateAsync({
          orderId,
          testCode,
          rejectionReason: reason,
          rejectionNotes: notes,
        });
      } catch (err) {
        const message = getErrorMessage(err, 'Failed to reject results');
        setActionError(message);
        logger.error('Failed to reject results', err instanceof Error ? err : undefined, {
          orderId,
          testCode,
          reason,
        });
        return null;
      }
    },
    [orderId, testCode, rejectMutation]
  );

  const clearError = useCallback(() => setActionError(null), []);

  return {
    options: options ?? null,
    isLoading,
    isRejecting: rejectMutation.isPending,
    error:
      actionError ??
      (fetchError ? getErrorMessage(fetchError, 'Failed to fetch rejection options') : null),
    fetchOptions,
    rejectWithReason,
    retestAttemptsRemaining: options?.retestAttemptsRemaining ?? 0,
    escalationRequired: options?.escalationRequired ?? false,
    clearError,
  };
}

/**
 * useRejectionManager Hook
 *
 * Manages the rejection workflow for test results, including:
 * - Fetching available rejection options from the API
 * - Tracking remaining attempts for retest and recollection
 * - Executing rejection actions
 * - Handling escalation when limits are reached
 */

import { useState, useCallback } from 'react';
import { resultAPI } from '@/features/lab-validation/data/results';
import { getErrorMessage } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { useFetchedResource } from '@/hooks/useFetchedResource';
import type {
  RejectionOptionsResponse,
  RejectionResult,
  AvailableAction,
} from '@/types/lab-operations';
import type { ResultRejectionType } from '@/types';

interface UseRejectionManagerProps {
  orderId: string | number;
  testCode: string;
  /** Automatically fetch options when the hook is initialized */
  autoFetch?: boolean;
}

interface UseRejectionManagerReturn {
  /** Current rejection options from the API */
  options: RejectionOptionsResponse | null;
  /** Whether options are being loaded */
  isLoading: boolean;
  /** Whether a rejection is in progress */
  isRejecting: boolean;
  /** Error message if any operation failed */
  error: string | null;
  /** Fetch rejection options from the API */
  fetchOptions: () => Promise<void>;
  /** Execute a rejection with the specified type and reason */
  rejectWithAction: (
    rejectionType: ResultRejectionType,
    reason: string
  ) => Promise<RejectionResult | null>;
  /** Check if a specific action is available */
  isActionEnabled: (action: 're-test' | 're-collect') => boolean;
  /** Get the disabled reason for an action */
  getDisabledReason: (action: 're-test' | 're-collect') => string | null;
  /** Get remaining attempts for retest */
  retestAttemptsRemaining: number;
  /** Get remaining attempts for recollection */
  recollectionAttemptsRemaining: number;
  /** Whether escalation is required (all options exhausted) */
  escalationRequired: boolean;
  /** Whether escalate action is offered by the API */
  isEscalateEnabled: boolean;
  /** Clear any error state */
  clearError: () => void;
}

export function useRejectionManager({
  orderId,
  testCode,
  autoFetch = false,
}: UseRejectionManagerProps): UseRejectionManagerReturn {
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isMissing = (id: string | number | null | undefined, code: string | null | undefined) =>
    id == null || id === '' || code == null || code === '';

  const fetcher = useCallback(async (): Promise<RejectionOptionsResponse> => {
    const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
    return resultAPI.getRejectionOptions(orderIdStr, testCode);
  }, [orderId, testCode]);

  const {
    data: options,
    isLoading,
    error: fetchError,
    refetch: fetchOptions,
    clearError: clearFetchError,
  } = useFetchedResource(fetcher, [orderId, testCode], {
    enabled: autoFetch && !isMissing(orderId, testCode),
    errorMessage: 'Failed to fetch rejection options',
    logContext: { orderId, testCode },
  });

  const rejectWithAction = useCallback(
    async (rejectionType: ResultRejectionType, reason: string): Promise<RejectionResult | null> => {
      if (isMissing(orderId, testCode)) {
        setActionError('Order ID and test code are required');
        return null;
      }

      setIsRejecting(true);
      setActionError(null);

      try {
        const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
        const result = await resultAPI.rejectResults(orderIdStr, testCode, {
          rejectionReason: reason,
          rejectionType,
        });
        return result;
      } catch (err) {
        const status =
          typeof err === 'object' && err !== null && 'status' in err
            ? (err as { status?: number }).status
            : undefined;
        if (typeof status === 'number' && status >= 200 && status < 300) {
          return {
            success: true,
            action: 'retest_same_sample',
            message: 'Rejection applied; response could not be parsed.',
            originalTestId: 0,
            escalationRequired: false,
          } as RejectionResult;
        }
        const message = getErrorMessage(err, 'Failed to reject results');
        setActionError(message);
        logger.error('Failed to reject results', err instanceof Error ? err : undefined, {
          orderId,
          testCode,
          rejectionType,
          reason,
        });
        return null;
      } finally {
        setIsRejecting(false);
      }
    },
    [orderId, testCode]
  );

  const findAction = useCallback(
    (actionType: 're-test' | 're-collect'): AvailableAction | undefined => {
      if (!options) return undefined;

      const actionMap = {
        're-test': 'retest_same_sample',
        're-collect': 'recollect_new_sample',
      };

      return options.availableActions.find(a => a.action === actionMap[actionType]);
    },
    [options]
  );

  const isActionEnabled = useCallback(
    (action: 're-test' | 're-collect'): boolean => {
      const actionInfo = findAction(action);
      return actionInfo?.enabled ?? false;
    },
    [findAction]
  );

  const getDisabledReason = useCallback(
    (action: 're-test' | 're-collect'): string | null => {
      const actionInfo = findAction(action);
      return actionInfo?.disabledReason ?? null;
    },
    [findAction]
  );

  const clearError = useCallback(() => {
    clearFetchError();
    setActionError(null);
  }, [clearFetchError]);

  const isEscalateEnabled =
    options?.availableActions.some(a => a.action === 'escalate' && a.enabled) ?? false;

  return {
    options: options ?? null,
    isLoading,
    isRejecting,
    error: actionError ?? fetchError,
    fetchOptions,
    rejectWithAction,
    isActionEnabled,
    getDisabledReason,
    retestAttemptsRemaining: options?.retestAttemptsRemaining ?? 0,
    recollectionAttemptsRemaining: options?.recollectionAttemptsRemaining ?? 0,
    escalationRequired: options?.escalationRequired ?? false,
    isEscalateEnabled,
    clearError,
  };
}

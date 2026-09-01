/**
 * Results API Service + React Query hooks
 */

import { apiClient } from '@/lib/apiClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateResultQueries } from '@/lib/query/invalidate';
import { queryKeys, cacheConfig } from '@/lib/query';
import { useAuthStore } from '@/app/store';
import type { OrderTest, ValidationDecision, TestWithContext } from '@/types';
import type {
  RejectionOptionsResponse,
  RejectionResult,
  EscalationResolveRequest,
  EscalationResolveResult,
} from '@/types/lab-operations';

/**
 * Request body for entering test results
 */
interface ResultEntryRequest {
  results: Record<string, unknown>; // TestResult objects
  technicianNotes?: string;
}

/**
 * Request body for validating test results (approval only)
 */
interface ResultValidationRequest {
  decision: ValidationDecision;
  validationNotes?: string;
}

/**
 * Request body for rejecting test results during validation.
 * Uses the /reject endpoint with proper tracking.
 */
interface ResultRejectionRequest {
  rejectionReason: string;
  rejectionNotes?: string;
}

export const resultAPI = {
  /**
   * Get tests pending result entry (status: sample-collected)
   * Excludes superseded tests.
   */
  async getPendingEntry(): Promise<OrderTest[]> {
    return apiClient.get<OrderTest[]>('/results/pending-entry');
  },

  /**
   * Get tests pending validation (status: completed)
   * Excludes superseded tests.
   */
  async getPendingValidation(): Promise<OrderTest[]> {
    return apiClient.get<OrderTest[]>('/results/pending-validation');
  },

  /**
   * Get tests pending escalation resolution (admin/labtech_plus only).
   * Returns enriched list (order + patient + test + sample context) as TestWithContext[].
   */
  async getPendingEscalation(): Promise<TestWithContext[]> {
    return apiClient.get<TestWithContext[]>('/results/pending-escalation');
  },

  /**
   * Resolve an escalated test (admin/labtech_plus only).
   * Actions: force_validate, authorize_retest, final_reject.
   */
  async resolveEscalation(
    orderId: string | number,
    testCode: string,
    payload: EscalationResolveRequest
  ): Promise<EscalationResolveResult> {
    const orderIdStr = typeof orderId === 'number' ? orderId.toString() : orderId;
    return apiClient.post<EscalationResolveResult>(
      `/results/${orderIdStr}/tests/${testCode}/escalation/resolve`,
      payload
    );
  },

  /**
   * Get available rejection options for a test.
   *
   * Returns information about what rejection actions are available,
   * remaining attempt counts, and whether escalation is required.
   *
   * Use this before showing the rejection dialog to know what options
   * to enable/disable.
   */
  async getRejectionOptions(orderId: string, testCode: string): Promise<RejectionOptionsResponse> {
    return apiClient.get<RejectionOptionsResponse>(
      `/results/${orderId}/tests/${testCode}/rejection-options`
    );
  },

  /**
   * Enter results for a test
   */
  async enterResults(
    orderId: string,
    testCode: string,
    data: ResultEntryRequest
  ): Promise<OrderTest> {
    return apiClient.post<OrderTest>(`/results/${orderId}/tests/${testCode}`, data);
  },

  /**
   * Validate test results - approval only.
   * For rejections, use rejectResults() instead.
   */
  async validateResults(
    orderId: string,
    testCode: string,
    data: ResultValidationRequest
  ): Promise<OrderTest> {
    return apiClient.post<OrderTest>(`/results/${orderId}/tests/${testCode}/validate`, data);
  },

  /**
   * Reject test results during validation.
   * Server auto-decides re-test vs escalation based on rejection count.
   */
  async rejectResults(
    orderId: string,
    testCode: string,
    data: ResultRejectionRequest
  ): Promise<RejectionResult> {
    return apiClient.post<RejectionResult>(`/results/${orderId}/tests/${testCode}/reject`, data);
  },

  /**
   * Bulk validate multiple test results in a single transaction.
   *
   * Processes all validations atomically. Partial failures are reported
   * but do not roll back successful validations.
   *
   * Note: Tests with critical values should be excluded from bulk validation
   * and handled individually to ensure proper notification workflow.
   */
  async validateBulk(
    items: Array<{ orderId: number; testCode: string }>,
    validationNotes?: string
  ): Promise<{
    results: Array<{
      orderId: number;
      testCode: string;
      success: boolean;
      error?: string;
      testId?: number;
    }>;
    successCount: number;
    failureCount: number;
  }> {
    return apiClient.post('/results/validate-bulk', {
      items,
      validationNotes,
    });
  },
};


/**
 * Result Mutations Hooks
 *
 * Provides TanStack Query mutation hooks for all result-related operations:
 * - Result entry
 * - Result validation (approval)
 * - Result rejection (re-test, re-collect, escalate)
 * - Bulk validation
 * - Escalation resolution
 *
 *  */

/**
 * Hook to enter results for a test.
 * Invalidates orders and results queries on success.
 */
export function useEnterResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      testCode,
      results,
      technicianNotes,
    }: {
      orderId: string | number;
      testCode: string;
      results: Record<string, unknown>;
      technicianNotes?: string;
    }) => {
      const orderIdStr = typeof orderId === 'number' ? orderId.toString() : orderId;
      return resultAPI.enterResults(orderIdStr, testCode, { results, technicianNotes });
    },
    onSuccess: (_, variables) => {
      const orderIdStr =
        typeof variables.orderId === 'number' ? variables.orderId.toString() : variables.orderId;
      invalidateResultQueries(queryClient, { orderId: orderIdStr, samples: false });
    },
  });
}

/**
 * Hook to validate (approve) test results.
 * Invalidates orders and results queries on success.
 */
export function useValidateResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      testCode,
      validationNotes,
    }: {
      orderId: string | number;
      testCode: string;
      validationNotes?: string;
    }) => {
      const orderIdStr = typeof orderId === 'number' ? orderId.toString() : orderId;
      return resultAPI.validateResults(orderIdStr, testCode, {
        decision: 'approved' as ValidationDecision,
        validationNotes,
      });
    },
    onSuccess: (_, variables) => {
      const orderIdStr =
        typeof variables.orderId === 'number' ? variables.orderId.toString() : variables.orderId;
      invalidateResultQueries(queryClient, { orderId: orderIdStr, samples: false });
    },
  });
}

/**
 * Hook to reject test results with proper tracking.
 * Supports re-test, re-collect, and escalate actions.
 * Invalidates orders, samples, and results queries on success.
 */
export function useRejectResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      testCode,
      rejectionReason,
      rejectionNotes,
    }: {
      orderId: string | number;
      testCode: string;
      rejectionReason: string;
      rejectionNotes?: string;
    }): Promise<RejectionResult> => {
      const orderIdStr = typeof orderId === 'number' ? orderId.toString() : orderId;
      return resultAPI.rejectResults(orderIdStr, testCode, {
        rejectionReason,
        rejectionNotes,
      });
    },
    onSuccess: (_, variables) => {
      const orderIdStr =
        typeof variables.orderId === 'number' ? variables.orderId.toString() : variables.orderId;
      invalidateResultQueries(queryClient, {
        orderId: orderIdStr,
        samples: true,
        pendingEscalation: true,
      });
    },
  });
}

/**
 * Hook to bulk validate multiple test results.
 * Invalidates orders and results queries on success.
 */
export function useValidateBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      items,
      validationNotes,
    }: {
      items: Array<{ orderId: number; testCode: string }>;
      validationNotes?: string;
    }) => resultAPI.validateBulk(items, validationNotes),
    onSuccess: () => {
      invalidateResultQueries(queryClient, { samples: false });
    },
  });
}

/**
 * Hook to resolve an escalated test (admin/labtech_plus only).
 * Supports force_validate, authorize_retest, and final_reject actions.
 * Invalidates orders, samples, and results queries on success.
 */
export function useResolveEscalation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      testCode,
      action,
      validationNotes,
      rejectionReason,
      readBack,
    }: {
      orderId: string | number;
      testCode: string;
      action: EscalationResolveRequest['action'];
      validationNotes?: string;
      rejectionReason?: string;
      readBack?: EscalationResolveRequest['readBack'];
    }) => {
      const { hasRole } = useAuthStore.getState();
      if (!hasRole(['administrator', 'lab-technician-plus'])) {
        throw new Error('You do not have permission to resolve escalations.');
      }
      const orderIdStr = typeof orderId === 'number' ? orderId.toString() : orderId;
      return resultAPI.resolveEscalation(orderIdStr, testCode, {
        action,
        validationNotes,
        rejectionReason,
        readBack,
      });
    },
    onSuccess: (_, variables) => {
      const orderIdStr =
        typeof variables.orderId === 'number' ? variables.orderId.toString() : variables.orderId;
      invalidateResultQueries(queryClient, {
        orderId: orderIdStr,
        samples: true,
        pendingEscalation: true,
      });
    },
  });
}


/**
 * Pending Escalation Query Hook
 *
 * Fetches tests pending escalation resolution (admin/labtech_plus only).
 */

export function usePendingEscalation() {
  const { isAuthenticated, isLoading: isRestoring, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);

  const query = useQuery({
    queryKey: queryKeys.results.pendingEscalation(),
    queryFn: () => resultAPI.getPendingEscalation(),
    enabled: isAuthenticated && !isRestoring && canResolveEscalation,
    ...cacheConfig.dynamic,
    refetchInterval: 15_000,
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

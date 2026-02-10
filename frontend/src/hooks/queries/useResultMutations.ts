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
 * @module hooks/queries/useResultMutations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/query';
import { resultAPI } from '@/services/api';
import { useAuthStore } from '@/shared/stores/auth.store';
import type { ValidationDecision, ResultRejectionType } from '@/types';
import type {
  RejectionResult,
  EscalationResolveRequest,
} from '@/types/lab-operations';

/**
 * Hook to fetch rejection options for a test.
 * Returns available actions, attempt limits, and escalation status.
 *
 * @param orderId - The order ID
 * @param testCode - The test code
 * @param enabled - Whether to enable the query (default: true when ids provided)
 */
export function useRejectionOptions(
  orderId: string | number | undefined,
  testCode: string | undefined,
  enabled = true
) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const orderIdStr = orderId ? String(orderId) : '';

  const query = useQuery({
    queryKey: queryKeys.results.rejectionOptions(orderIdStr, testCode ?? ''),
    queryFn: () => resultAPI.getRejectionOptions(orderIdStr, testCode!),
    enabled: isAuthenticated && !isRestoring && enabled && !!orderId && !!testCode,
    ...cacheConfig.dynamic,
  });

  return {
    options: query.data ?? null,
    isLoading: query.isLoading,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

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
      const orderIdStr = typeof variables.orderId === 'number' ? variables.orderId.toString() : variables.orderId;
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(orderIdStr) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.results.all });
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
      const orderIdStr = typeof variables.orderId === 'number' ? variables.orderId.toString() : variables.orderId;
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(orderIdStr) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.results.all });
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
      rejectionType,
    }: {
      orderId: string | number;
      testCode: string;
      rejectionReason: string;
      rejectionType: ResultRejectionType;
    }): Promise<RejectionResult> => {
      const orderIdStr = typeof orderId === 'number' ? orderId.toString() : orderId;
      return resultAPI.rejectResults(orderIdStr, testCode, {
        rejectionReason,
        rejectionType,
      });
    },
    onSuccess: (_, variables) => {
      const orderIdStr = typeof variables.orderId === 'number' ? variables.orderId.toString() : variables.orderId;
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(orderIdStr) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.results.all });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      const uniqueOrderIds = new Set(variables.items.map(i => String(i.orderId)));
      uniqueOrderIds.forEach(id => {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(id) });
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.results.all });
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
    }: {
      orderId: string | number;
      testCode: string;
      action: EscalationResolveRequest['action'];
      validationNotes?: string;
      rejectionReason?: string;
    }) => {
      const orderIdStr = typeof orderId === 'number' ? orderId.toString() : orderId;
      return resultAPI.resolveEscalation(orderIdStr, testCode, {
        action,
        validationNotes,
        rejectionReason,
      });
    },
    onSuccess: (_, variables) => {
      const orderIdStr = typeof variables.orderId === 'number' ? variables.orderId.toString() : variables.orderId;
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(orderIdStr) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.results.all });
    },
  });
}

/**
 * Hook to fetch tests pending escalation resolution.
 * Only available for admin/labtech_plus roles.
 */
export function usePendingEscalation() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.results.pendingEscalation(),
    queryFn: () => resultAPI.getPendingEscalation(),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
  });

  return {
    tests: query.data ?? [],
    isLoading: query.isLoading,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

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

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateResultQueries } from '@/lib/query/invalidate';
import { resultAPI } from '@/features/validation/api/results';
import { useAuthStore } from '@/app/store';
import type { ValidationDecision, ResultRejectionType } from '@/types';
import type { RejectionResult, EscalationResolveRequest } from '@/types/lab-operations';

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
      const orderIdStr =
        typeof variables.orderId === 'number' ? variables.orderId.toString() : variables.orderId;
      invalidateResultQueries(queryClient, { orderId: orderIdStr, samples: true });
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
    }: {
      orderId: string | number;
      testCode: string;
      action: EscalationResolveRequest['action'];
      validationNotes?: string;
      rejectionReason?: string;
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

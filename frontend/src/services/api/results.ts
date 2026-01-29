/**
 * Results API Service
 * Handles result entry and validation operations
 */

import { apiClient } from './client';
import type { OrderTest, ValidationDecision, ResultRejectionType } from '@/types';
import type {
  RejectionOptionsResponse,
  RejectionResult,
  EscalationResolveRequest,
  EscalationResolveResult,
  PendingEscalationItem,
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
  /** Reason for rejecting the results */
  rejectionReason: string;
  /**
   * Type of rejection:
   * - 're-test': Re-run with same sample, creates new OrderTest entry
   * - 're-collect': New sample required, triggers sample recollection flow
   * - 'escalate': Escalate to supervisor when limits exceeded
   */
  rejectionType: ResultRejectionType;
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
   * Returns enriched list (order + patient + test + sample context) for Escalation tab.
   */
  async getPendingEscalation(): Promise<PendingEscalationItem[]> {
    return apiClient.get<PendingEscalationItem[]>('/results/pending-escalation');
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
   * Reject test results during validation with proper tracking.
   *
   * Two rejection paths:
   * - 're-test': Creates NEW OrderTest linked to original, sample remains valid.
   *              Original test is marked as SUPERSEDED.
   * - 're-collect': Rejects the sample and triggers recollection flow.
   *                 Original test waits for new sample.
   *
   * Both paths maintain rejection history for audit trail.
   *
   * Before calling this, use getRejectionOptions() to check what actions
   * are available and whether any limits have been reached.
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

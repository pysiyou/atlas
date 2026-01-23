/**
 * Results API Service
 * Handles result entry and validation operations
 */

import { apiClient } from './client';
import type { OrderTest, ValidationDecision, ResultRejectionType } from '@/types';
import type { RejectionOptionsResponse, RejectionResult } from '@/types/lab-operations';

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
};

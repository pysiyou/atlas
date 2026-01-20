/**
 * Results API Service
 * Handles result entry and validation operations
 */

import { apiClient } from './client';
import type { OrderTest, ValidationDecision, ResultRejectionType } from '@/types';

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
 * Uses the new /reject endpoint with proper tracking.
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
   * Enter results for a test
   */
  async enterResults(
    orderId: string,
    testCode: string,
    data: ResultEntryRequest
  ): Promise<OrderTest> {
    return apiClient.post<OrderTest>(
      `/results/${orderId}/tests/${testCode}`,
      data
    );
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
    return apiClient.post<OrderTest>(
      `/results/${orderId}/tests/${testCode}/validate`,
      data
    );
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
   */
  async rejectResults(
    orderId: string,
    testCode: string,
    data: ResultRejectionRequest
  ): Promise<OrderTest> {
    return apiClient.post<OrderTest>(
      `/results/${orderId}/tests/${testCode}/reject`,
      data
    );
  },
};

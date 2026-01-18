/**
 * Results API Service
 * Handles result entry and validation operations
 */

import { apiClient } from './client';
import type { OrderTest, ValidationDecision } from '@/types';

/**
 * Request body for entering test results
 */
interface ResultEntryRequest {
  results: Record<string, unknown>; // TestResult objects
  technicianNotes?: string;
}

/**
 * Request body for validating test results
 */
interface ResultValidationRequest {
  decision: ValidationDecision;
  validationNotes?: string;
}

/**
 * Request body for rejecting test results
 */
interface ResultRejectionRequest {
  decision: ValidationDecision;
  rejectionNotes: string;
  requiresRecollection?: boolean;
}

export const resultAPI = {
  /**
   * Get tests pending result entry (status: sample-collected)
   */
  async getPendingEntry(): Promise<OrderTest[]> {
    return apiClient.get<OrderTest[]>('/results/pending-entry');
  },

  /**
   * Get tests pending validation (status: completed)
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
   * Validate test results (approve or reject)
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
   * Reject test results with re-test or re-collection
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

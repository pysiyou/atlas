/**
 * Results API Service
 * Handles result entry and validation
 */

import { apiClient } from './client';
import type { OrderTest, TestResult, ValidationDecision } from '@/types';

interface ResultEntryRequest {
  results: Record<string, TestResult>;
  technicianNotes?: string;
}

interface ResultValidationRequest {
  decision: ValidationDecision;
  validationNotes?: string;
}

export const resultAPI = {
  /**
   * Get tests awaiting result entry (lab tech)
   */
  async getPendingEntry(): Promise<OrderTest[]> {
    return apiClient.get<OrderTest[]>('/results/pending-entry');
  },

  /**
   * Get tests awaiting validation (pathologist)
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
    return apiClient.post<OrderTest>(`/results/${orderId}/tests/${testCode}`, data);
  },

  /**
   * Validate results for a test
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
};

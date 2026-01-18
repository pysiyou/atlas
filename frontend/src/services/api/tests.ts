/**
 * Tests API Service
 * Handles test catalog operations
 */

import { apiClient } from './client';
import type { Test, TestCategory } from '@/types';

interface GetTestsParams {
  category?: TestCategory;
  activeOnly?: boolean;
  skip?: number;
  limit?: number;
}

export const testAPI = {
  /**
   * Get all tests with optional filters
   */
  async getAll(params?: GetTestsParams): Promise<Test[]> {
    const queryParams: Record<string, string> = {};
    if (params?.category) queryParams.category = params.category;
    if (params?.activeOnly !== undefined) queryParams.activeOnly = String(params.activeOnly);
    if (params?.skip) queryParams.skip = String(params.skip);
    if (params?.limit) queryParams.limit = String(params.limit);
    return apiClient.get<Test[]>('/tests', queryParams);
  },

  /**
   * Get a test by its code
   */
  async getByCode(testCode: string): Promise<Test | null> {
    try {
      return await apiClient.get<Test>(`/tests/${testCode}`);
    } catch {
      return null;
    }
  },

  /**
   * Search tests by query string
   */
  async search(query: string): Promise<Test[]> {
    return apiClient.get<Test[]>('/tests/search', { q: query });
  },

  /**
   * Create a new test (admin only)
   */
  async create(test: Omit<Test, 'createdAt' | 'updatedAt'>): Promise<Test> {
    return apiClient.post<Test>('/tests', test);
  },

  /**
   * Update a test (admin only)
   */
  async update(testCode: string, updates: Partial<Test>): Promise<Test> {
    return apiClient.put<Test>(`/tests/${testCode}`, updates);
  },
};

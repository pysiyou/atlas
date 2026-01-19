/**
 * Tests API Service
 * Handles test catalog operations
 */

import { apiClient } from './client';
import type { Test, TestCategory, TestParameter, ResultItem } from '@/types';

interface GetTestsParams {
  category?: TestCategory;
  activeOnly?: boolean;
  skip?: number;
  limit?: number;
}

/**
 * API response test format (from backend)
 * Backend returns resultItems, which we need to transform to parameters
 */
interface APITestResponse extends Omit<Test, 'parameters'> {
  resultItems?: ResultItem[];
  turnaroundTimeHours?: number;
}

/**
 * Transform backend resultItems to frontend TestParameter format
 * @param resultItems - Result items from backend API
 * @returns Array of TestParameter objects
 */
function mapResultItemsToParameters(resultItems?: ResultItem[]): TestParameter[] | undefined {
  if (!resultItems || resultItems.length === 0) return undefined;

  return resultItems.map((item): TestParameter => {
    // Determine type from valueType
    let type: 'numeric' | 'text' | 'qualitative' | 'select' = 'text';
    if (item.value_type === 'NUMERIC') type = 'numeric';
    else if (item.value_type === 'SELECT') type = 'select';
    else if (item.value_type === 'TEXT') type = 'text';

    // Build reference range string from catalogReferenceRange
    let referenceRange = '';
    if (item.reference_range) {
      const range = item.reference_range.adult_general || 
                    item.reference_range.adult_male || 
                    item.reference_range.adult_female;
      if (range) {
        if (range.low !== undefined && range.high !== undefined) {
          referenceRange = `${range.low} - ${range.high}`;
        } else if (range.low !== undefined) {
          referenceRange = `> ${range.low}`;
        } else if (range.high !== undefined) {
          referenceRange = `< ${range.high}`;
        }
      }
    }

    return {
      code: item.item_code,
      name: item.item_name,
      unit: item.unit || '',
      type,
      referenceRange,
      valueType: item.value_type,
      catalogReferenceRange: item.reference_range,
      criticalLow: item.critical_range?.low,
      criticalHigh: item.critical_range?.high,
      allowedValues: item.allowed_values,
      decimalsSuggested: item.decimals_suggested,
      decimalPlaces: item.decimals_suggested,
    };
  });
}

/**
 * Transform API test response to frontend Test format
 * @param apiTest - Test data from backend API
 * @returns Test object with parameters mapped from resultItems
 */
function transformAPITest(apiTest: APITestResponse): Test {
  const { resultItems, turnaroundTimeHours, ...rest } = apiTest;
  return {
    ...rest,
    turnaroundTime: turnaroundTimeHours ?? rest.turnaroundTime ?? 0,
    parameters: mapResultItemsToParameters(resultItems),
  };
}

export const testAPI = {
  /**
   * Get all tests with optional filters
   * Transforms resultItems to parameters for frontend compatibility
   */
  async getAll(params?: GetTestsParams): Promise<Test[]> {
    const queryParams: Record<string, string> = {};
    if (params?.category) queryParams.category = params.category;
    if (params?.activeOnly !== undefined) queryParams.activeOnly = String(params.activeOnly);
    if (params?.skip) queryParams.skip = String(params.skip);
    if (params?.limit) queryParams.limit = String(params.limit);
    
    const apiTests = await apiClient.get<APITestResponse[]>('/tests', queryParams);
    return apiTests.map(transformAPITest);
  },

  /**
   * Get a test by its code
   * Transforms resultItems to parameters for frontend compatibility
   */
  async getByCode(testCode: string): Promise<Test | null> {
    try {
      const apiTest = await apiClient.get<APITestResponse>(`/tests/${testCode}`);
      return transformAPITest(apiTest);
    } catch {
      return null;
    }
  },

  /**
   * Search tests by query string
   * Transforms resultItems to parameters for frontend compatibility
   */
  async search(query: string): Promise<Test[]> {
    const apiTests = await apiClient.get<APITestResponse[]>('/tests/search', { q: query });
    return apiTests.map(transformAPITest);
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

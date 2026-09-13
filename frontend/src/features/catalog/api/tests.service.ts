/**
 * Tests API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import type { ApiTestResponse } from '@/lib/api/types';
import { REFERENCE_DATA_LIMIT } from '@/lib/api/constants';
import type { Test, TestCategory, TestParameter, ResultItem } from '@/types';

interface GetTestsParams {
  category?: TestCategory;
  activeOnly?: boolean;
  skip?: number;
  limit?: number;
}

/** Backend test DTO with resultItems before domain transform */
type APITestResponse = ApiTestResponse & {
  resultItems?: ResultItem[];
};

function mapResultItemsToParameters(resultItems?: ResultItem[]): TestParameter[] | undefined {
  if (!resultItems || resultItems.length === 0) return undefined;

  return resultItems.map((item): TestParameter => {
    let type: 'numeric' | 'text' | 'qualitative' | 'select' = 'text';
    if (item.value_type === 'NUMERIC') type = 'numeric';
    else if (item.value_type === 'SELECT') type = 'select';
    else if (item.value_type === 'TEXT') type = 'text';

    let referenceRange = '';
    if (item.reference_range) {
      const range =
        item.reference_range.adult_general ||
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

function transformAPITest(apiTest: APITestResponse): Test {
  const { resultItems, turnaroundTimeHours, ...rest } = apiTest;
  return {
    ...(rest as unknown as Test),
    turnaroundTime: turnaroundTimeHours ?? 0,
    parameters: mapResultItemsToParameters(resultItems),
  };
}

export const testAPI = {
  async getAll(params?: GetTestsParams): Promise<Test[]> {
    const queryParams: Record<string, string> = {
      limit: String(REFERENCE_DATA_LIMIT),
    };
    if (params?.category) queryParams.category = params.category;
    if (params?.activeOnly !== undefined) queryParams.activeOnly = String(params.activeOnly);
    if (params?.skip) queryParams.skip = String(params.skip);
    if (params?.limit) queryParams.limit = String(params.limit);

    const apiTests = await apiClient.get<APITestResponse[]>('/tests', queryParams);
    return apiTests.map(transformAPITest);
  },

  async getByCode(testCode: string): Promise<Test | null> {
    try {
      const apiTest = await apiClient.get<APITestResponse>(`/tests/${testCode}`);
      return transformAPITest(apiTest);
    } catch {
      return null;
    }
  },

  async search(query: string): Promise<Test[]> {
    const apiTests = await apiClient.get<APITestResponse[]>('/tests/search', { q: query });
    return apiTests.map(transformAPITest);
  },

  async create(test: Omit<Test, 'createdAt' | 'updatedAt'>): Promise<Test> {
    return apiClient.post<Test>('/tests', test);
  },

  async update(testCode: string, updates: Partial<Test>): Promise<Test> {
    return apiClient.put<Test>(`/tests/${testCode}`, updates);
  },
};

/**
 * Tests API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import { expectArray } from '@/lib/api/errors';
import type { ApiTestResponse } from '@/lib/api/types';
import { REFERENCE_DATA_LIMIT } from '@/lib/api/constants';
import type { Test, TestCategory, TestParameter, ResultItem } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useEntityLookup } from '@/hooks/useEntityLookup';
import { queryKeys, cacheConfig } from '@/lib/query';
import { useInvalidateQueryKey } from '@/lib/query/invalidate';
import { useAuthStore } from '@/app/authStore';

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

    const apiTests = expectArray<APITestResponse>(
      await apiClient.get<APITestResponse[]>('/tests', queryParams),
      'catalog'
    );
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
    const apiTests = expectArray<APITestResponse>(
      await apiClient.get<APITestResponse[]>('/tests/search', { q: query }),
      'catalog search'
    );
    return apiTests.map(transformAPITest);
  },

  async create(test: Omit<Test, 'createdAt' | 'updatedAt'>): Promise<Test> {
    return apiClient.post<Test>('/tests', test);
  },

  async update(testCode: string, updates: Partial<Test>): Promise<Test> {
    return apiClient.put<Test>(`/tests/${testCode}`, updates);
  },
};

/**
 * Tests API hooks — React Query layer.
 */

/**
 * Hook to fetch and cache all tests from the catalog.
 * Uses Infinity cache - data is fetched once per session.
 * Only fetches when user is authenticated to prevent race conditions on login.
 *
 * @returns Query result containing tests array, loading state, and error
 *
 * @example
 * ```tsx
 * const { tests, isLoading, error } = useTestCatalog();
 * ```
 */
export function useTestCatalog() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.tests.all,
    queryFn: () => testAPI.getAll(),
    enabled: isAuthenticated && !isRestoring, // Only fetch when authenticated and not restoring
    ...cacheConfig.static, // Infinity cache - never refetch automatically
  });

  return {
    tests: query.data ?? [],
    isLoading: query.isLoading,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch a single test by code.
 * Uses the cached test catalog to avoid additional API calls.
 * Only fetches when user is authenticated to prevent race conditions on login.
 *
 * @param testCode - The unique test code (e.g., 'CBC', 'HEM001')
 * @returns The test object or undefined if not found
 *
 * @example
 * ```tsx
 * const { test, isLoading } = useTest('HEM001');
 * ```
 */
export function useTest(testCode: string | undefined) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.tests.byCode(testCode ?? ''),
    queryFn: () => testAPI.getByCode(testCode!),
    enabled: isAuthenticated && !isRestoring && !!testCode, // Only fetch when authenticated and not restoring
    ...cacheConfig.static,
  });

  return {
    test: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Hook to search tests by query string.
 * Searches name, code, synonyms, LOINC codes, and panels.
 *
 * @param query - Search query string
 * @returns Filtered array of tests matching the query
 *
 * @example
 * ```tsx
 * const { results, isSearching } = useTestSearch('blood count');
 * ```
 */
export function useTestSearch(searchQuery: string) {
  const { tests, isLoading } = useTestCatalog();

  // Client-side search since catalog is fully cached
  const results = searchQuery.trim()
    ? tests.filter(test => {
        const query = searchQuery.toLowerCase();
        return (
          test.name.toLowerCase().includes(query) ||
          test.code.toLowerCase().includes(query) ||
          test.synonyms?.some(syn => syn.toLowerCase().includes(query)) ||
          test.loincCodes?.some(loinc => loinc.toLowerCase().includes(query)) ||
          test.panels?.some(panel => panel.toLowerCase().includes(query))
        );
      })
    : tests;

  return {
    results,
    isSearching: isLoading,
    totalCount: tests.length,
  };
}

/**
 * Hook to get tests filtered by category.
 *
 * @param category - Test category to filter by
 * @returns Array of tests in the specified category
 *
 * @example
 * ```tsx
 * const { tests } = useTestsByCategory('hematology');
 * ```
 */
export function useTestsByCategory(category: TestCategory | undefined) {
  const { tests, isLoading } = useTestCatalog();

  const filteredTests = category
    ? tests.filter(test => test.category === category && test.isActive)
    : tests.filter(test => test.isActive);

  return {
    tests: filteredTests,
    isLoading,
  };
}

/**
 * Hook to get only active tests.
 *
 * @returns Array of active tests
 */
export function useActiveTests() {
  const { tests, isLoading } = useTestCatalog();

  const activeTests = tests.filter(test => test.isActive);

  return {
    tests: activeTests,
    isLoading,
    count: activeTests.length,
  };
}

/**
 * Hook to get a test by its name (for display purposes).
 * Returns a lookup function that can be used to resolve test codes to names.
 *
 * @returns Object with getTestName function
 *
 * @example
 * ```tsx
 * const { getTestName } = useTestNameLookup();
 * const name = getTestName('HEM001'); // "Complete Blood Count (CBC)"
 * ```
 */
export function useTestNameLookup() {
  const { tests, isLoading } = useTestCatalog();
  const { get } = useEntityLookup(tests, t => t.code, { isLoading });

  const getTestName = (testCode: string): string => get(testCode)?.name ?? testCode;
  const getTest = (testCode: string): Test | undefined => get(testCode);

  return {
    getTestName,
    getTest,
    isLoading,
  };
}

/**
 * Hook to invalidate and refetch the test catalog.
 * Useful for admin actions that modify the catalog.
 *
 * @returns Function to invalidate the test cache
 */
export function useInvalidateTestCatalog() {
  const { invalidateAll: invalidate } = useInvalidateQueryKey(queryKeys.tests.all);
  return { invalidate };
}

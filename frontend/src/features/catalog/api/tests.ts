/**
 * Tests API service — slim list for names/search, full documents by code.
 */
import { apiClient } from '@/lib/api/client';
import { expectArray } from '@/lib/api/errors';
import type { ApiTestResponse, ApiTestSummaryResponse } from '@/lib/api/types';
import { REFERENCE_DATA_LIMIT } from '@/lib/api/constants';
import type {
  ContainerTopColor,
  ContainerType,
  ResultItem,
  SampleType,
  Test,
  TestCategory,
  TestParameter,
  TestSummary,
} from '@/types';
import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  buildParameterLabelMap,
  chunkTestCodes,
  indexTestsByCode,
  uniqueSortedTestCodes,
} from '../testLookup';
import { cacheConfig, getQueryClient, queryKeys, useAuthQueryEnabled } from '@/lib/query';
import { useInvalidateQueryKey } from '@/lib/query/invalidate';

interface GetTestsParams {
  category?: TestCategory;
  activeOnly?: boolean;
  skip?: number;
  limit?: number;
}

/** Backend full test DTO with resultItems before domain transform. */
type APITestResponse = ApiTestResponse & {
  resultItems?: ResultItem[];
};

const EMPTY_SUMMARIES: TestSummary[] = [];
const EMPTY_SUMMARY_BY_CODE = new Map<string, TestSummary>();
const EMPTY_FULL_TESTS: Test[] = [];
const EMPTY_FULL_BY_CODE = new Map<string, Test>();

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
        if (range.text?.trim()) {
          referenceRange = range.text.trim();
        } else if (range.low !== undefined && range.high !== undefined) {
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

function transformAPITestSummary(apiTest: ApiTestSummaryResponse): TestSummary {
  return {
    code: apiTest.code,
    name: apiTest.name,
    synonyms: apiTest.synonyms ?? undefined,
    category: apiTest.category as TestCategory,
    price: apiTest.price,
    turnaroundTime: apiTest.turnaroundTimeHours ?? 0,
    sampleType: apiTest.sampleType as SampleType,
    isActive: apiTest.isActive,
    createdAt: apiTest.createdAt,
    updatedAt: apiTest.updatedAt,
    containerTypes: (apiTest.containerTypes ?? []) as ContainerType[],
    containerTopColors: (apiTest.containerTopColors ?? []) as ContainerTopColor[],
    panels: apiTest.panels ?? undefined,
    loincCodes: apiTest.loincCodes ?? undefined,
    fastingRequired: apiTest.fastingRequired ?? undefined,
  };
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
  async getAll(params?: GetTestsParams): Promise<TestSummary[]> {
    const queryParams: Record<string, string> = {
      limit: String(REFERENCE_DATA_LIMIT),
    };
    if (params?.category) queryParams.category = params.category;
    if (params?.activeOnly !== undefined) queryParams.activeOnly = String(params.activeOnly);
    if (params?.skip) queryParams.skip = String(params.skip);
    if (params?.limit) queryParams.limit = String(params.limit);

    const apiTests = expectArray<ApiTestSummaryResponse>(
      await apiClient.get<ApiTestSummaryResponse[]>('/tests', queryParams),
      'catalog'
    );
    return apiTests.map(transformAPITestSummary);
  },

  async getByCode(testCode: string): Promise<Test | null> {
    try {
      const apiTest = await apiClient.get<APITestResponse>(`/tests/${testCode}`);
      return transformAPITest(apiTest);
    } catch {
      return null;
    }
  },

  async getByCodes(codes: string[]): Promise<Test[]> {
    if (codes.length === 0) return [];
    const apiTests = expectArray<APITestResponse>(
      await apiClient.get<APITestResponse[]>('/tests/by-codes', { codes: codes.join(',') }),
      'catalog by-codes'
    );
    return apiTests.map(transformAPITest);
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
 * Prefetched slim catalog (names, search, pickers). Full parameters are not included.
 */
export function useTestCatalog() {
  const enabled = useAuthQueryEnabled();

  const query = useQuery({
    queryKey: queryKeys.tests.list({ activeOnly: true }),
    queryFn: () => testAPI.getAll({ activeOnly: true }),
    enabled,
    ...cacheConfig.static,
  });

  const tests = query.data ?? EMPTY_SUMMARIES;
  const byCode = useMemo(
    () => (tests.length > 0 ? indexTestsByCode(tests) : EMPTY_SUMMARY_BY_CODE),
    [tests]
  );
  const getTest = useCallback((testCode: string): TestSummary | undefined => byCode.get(testCode), [byCode]);
  const getTestName = useCallback(
    (testCode: string): string => byCode.get(testCode)?.name ?? testCode,
    [byCode]
  );

  return {
    tests,
    byCode,
    getTest,
    getTestName,
    isLoading: query.isLoading,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Parameter code → display name for one full catalog document.
 */
export function useParameterLabelMap(testCode?: string): Record<string, string> {
  const { test } = useTest(testCode);
  return useMemo(() => buildParameterLabelMap(test ?? undefined), [test]);
}

/**
 * Fetch one full catalog document by code (`GET /tests/{code}`).
 * Does not treat a slim list row as a full Test.
 */
export function useTest(testCode: string | undefined) {
  const enabled = useAuthQueryEnabled(Boolean(testCode));

  const query = useQuery({
    queryKey: queryKeys.tests.byCode(testCode ?? ''),
    queryFn: () => testAPI.getByCode(testCode!),
    enabled,
    ...cacheConfig.static,
  });

  return {
    test: query.data ?? undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Batch-load full catalog documents for the given codes and seed `tests.byCode` cache.
 */
export function useTestsByCodes(codes: readonly string[]) {
  const codesKey = uniqueSortedTestCodes(codes).join(',');
  const sortedCodes = useMemo(() => (codesKey ? codesKey.split(',') : []), [codesKey]);
  const enabled = useAuthQueryEnabled(sortedCodes.length > 0);

  const query = useQuery({
    queryKey: queryKeys.tests.byCodes(sortedCodes),
    queryFn: async () => {
      const tests: Test[] = [];
      for (const chunk of chunkTestCodes(sortedCodes)) {
        tests.push(...(await testAPI.getByCodes(chunk)));
      }
      const client = getQueryClient();
      for (const test of tests) {
        client.setQueryData(queryKeys.tests.byCode(test.code), test);
      }
      return tests;
    },
    enabled,
    ...cacheConfig.static,
  });

  const tests = query.data ?? EMPTY_FULL_TESTS;
  const byCode = useMemo(
    () => (tests.length > 0 ? indexTestsByCode(tests) : EMPTY_FULL_BY_CODE),
    [tests]
  );

  return {
    tests,
    byCode,
    isLoading: query.isLoading,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Client-side search over the slim catalog (name, code, synonyms, LOINC, panels).
 */
export function useTestSearch(searchQuery: string) {
  const { tests, isLoading } = useTestCatalog();

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
 * Slim catalog rows for one category (active only).
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
 * Active slim catalog rows.
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
 * Name lookup over the slim catalog Map. `getTest` returns a summary, not parameters.
 */
export function useTestNameLookup() {
  const { getTest, getTestName, isLoading } = useTestCatalog();
  return { getTestName, getTest, isLoading };
}

/**
 * Invalidate the slim catalog list (and nested test queries under `tests`).
 */
export function useInvalidateTestCatalog() {
  const { invalidateAll: invalidate } = useInvalidateQueryKey(queryKeys.tests.all);
  return { invalidate };
}

/**
 * Orderable tests API — slim list for names/search, full documents by code.
 * Wire types come from OpenAPI; workups[] is the only client-side enrichment.
 */
import { apiClient } from '@/lib/api';
import { expectArray } from '@/lib/api';
import type { ApiOrderableTestResponse, ApiOrderableTestSummaryResponse } from '@/lib/api/types';
import { REFERENCE_DATA_LIMIT } from '@/lib/api';
import type { OrderableTest, OrderableTestSummary } from '@/types';
import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  buildAnalyteLabelMap,
  chunkTestCodes,
  indexTestsByCode,
  uniqueSortedTestCodes,
} from '../utils/orderableTestLookup';
import { cacheConfig, getQueryClient, queryKeys, useAuthQueryEnabled } from '@/lib/query';
import { CLINICAL_WORKUP_BY_ID } from '@/types/generated/clinicalWorkups';

function workupIdsForTest(testCode: string): string[] {
  return Object.values(CLINICAL_WORKUP_BY_ID)
    .filter(workup => workup.test_codes?.includes(testCode))
    .map(workup => workup.id);
}

function withWorkupsSummary(test: ApiOrderableTestSummaryResponse): OrderableTestSummary {
  return { ...test, workups: workupIdsForTest(test.code) };
}

function withWorkupsFull(test: ApiOrderableTestResponse): OrderableTest {
  return { ...test, workups: workupIdsForTest(test.code) };
}

interface GetOrderableTestsParams {
  category?: string;
  activeOnly?: boolean;
  skip?: number;
  limit?: number;
}

const EMPTY_SUMMARIES: OrderableTestSummary[] = [];
const EMPTY_SUMMARY_BY_CODE = new Map<string, OrderableTestSummary>();
const EMPTY_FULL_TESTS: OrderableTest[] = [];
const EMPTY_FULL_BY_CODE = new Map<string, OrderableTest>();

export const orderableTestAPI = {
  async getAll(params?: GetOrderableTestsParams): Promise<OrderableTestSummary[]> {
    const queryParams: Record<string, string> = {
      limit: String(REFERENCE_DATA_LIMIT),
    };
    if (params?.category) queryParams.category = params.category;
    if (params?.activeOnly !== undefined) queryParams.activeOnly = String(params.activeOnly);
    if (params?.skip) queryParams.skip = String(params.skip);
    if (params?.limit) queryParams.limit = String(params.limit);

    const apiTests = expectArray<ApiOrderableTestSummaryResponse>(
      await apiClient.get<ApiOrderableTestSummaryResponse[]>('/orderable-tests', queryParams),
      'catalog'
    );
    return apiTests.map(withWorkupsSummary);
  },

  async getByCode(testCode: string): Promise<OrderableTest | null> {
    try {
      const apiTest = await apiClient.get<ApiOrderableTestResponse>(`/orderable-tests/${testCode}`);
      return withWorkupsFull(apiTest);
    } catch {
      return null;
    }
  },

  async getByCodes(codes: string[]): Promise<OrderableTest[]> {
    if (codes.length === 0) return [];
    const apiTests = expectArray<ApiOrderableTestResponse>(
      await apiClient.get<ApiOrderableTestResponse[]>('/orderable-tests/by-codes', {
        codes: codes.join(','),
      }),
      'catalog by-codes'
    );
    return apiTests.map(withWorkupsFull);
  },

  async search(query: string): Promise<OrderableTest[]> {
    const apiTests = expectArray<ApiOrderableTestResponse>(
      await apiClient.get<ApiOrderableTestResponse[]>('/orderable-tests/search', { q: query }),
      'catalog search'
    );
    return apiTests.map(withWorkupsFull);
  },
};

/** Prefetched slim catalog (names, search, pickers). */
export function useOrderableTests() {
  const enabled = useAuthQueryEnabled();

  const query = useQuery({
    queryKey: queryKeys.orderableTests.list({ activeOnly: true }),
    queryFn: () => orderableTestAPI.getAll({ activeOnly: true }),
    enabled,
    ...cacheConfig.static,
  });

  const tests = query.data ?? EMPTY_SUMMARIES;
  const byCode = useMemo(
    () => (tests.length > 0 ? indexTestsByCode(tests) : EMPTY_SUMMARY_BY_CODE),
    [tests]
  );
  const getTest = useCallback(
    (testCode: string): OrderableTestSummary | undefined => byCode.get(testCode),
    [byCode]
  );
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

export function useAnalyteLabelMap(testCode?: string): Record<string, string> {
  const { test } = useOrderableTest(testCode);
  return useMemo(() => buildAnalyteLabelMap(test ?? undefined), [test]);
}

export function useOrderableTest(testCode: string | undefined) {
  const enabled = useAuthQueryEnabled(Boolean(testCode));

  const query = useQuery({
    queryKey: queryKeys.orderableTests.byCode(testCode ?? ''),
    queryFn: () => orderableTestAPI.getByCode(testCode!),
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

export function useOrderableTestsByCodes(codes: readonly string[]) {
  const codesKey = uniqueSortedTestCodes(codes).join(',');
  const sortedCodes = useMemo(() => (codesKey ? codesKey.split(',') : []), [codesKey]);
  const enabled = useAuthQueryEnabled(sortedCodes.length > 0);

  const query = useQuery({
    queryKey: queryKeys.orderableTests.byCodes(sortedCodes),
    queryFn: async () => {
      const tests: OrderableTest[] = [];
      for (const chunk of chunkTestCodes(sortedCodes)) {
        tests.push(...(await orderableTestAPI.getByCodes(chunk)));
      }
      const client = getQueryClient();
      for (const test of tests) {
        client.setQueryData(queryKeys.orderableTests.byCode(test.code), test);
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

export {
  useActiveOrderableTests,
  useInvalidateOrderableTests,
  useOrderableTestNameLookup,
  useOrderableTestSearch,
  useOrderableTestsByCategory,
} from './orderableTestHooks';
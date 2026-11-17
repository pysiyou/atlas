/**
 * Orderable tests API — slim list for names/search, full documents by code.
 */
import { apiClient } from '@/lib/api';
import { expectArray } from '@/lib/api';
import type { ApiOrderableTestResponse, ApiOrderableTestSummaryResponse } from '@/lib/api/types';
import { REFERENCE_DATA_LIMIT } from '@/lib/api';
import type {
  AnalyteDefinition,
  CatalogReferenceRange,
  ContainerTopColor,
  ContainerType,
  OrderableTest,
  OrderableTestSummary,
  SampleType,
  TestCategory,
} from '@/types';
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

interface GetOrderableTestsParams {
  category?: TestCategory;
  activeOnly?: boolean;
  skip?: number;
  limit?: number;
}

type ApiAnalyteSummary = {
  analyteCode: string;
  name: string;
  loincCode?: string | null;
  unit?: string | null;
  definition?: Record<string, unknown> | null;
};

type APIOrderableTestResponse = ApiOrderableTestResponse & {
  analytes?: ApiAnalyteSummary[];
};

const EMPTY_SUMMARIES: OrderableTestSummary[] = [];
const EMPTY_SUMMARY_BY_CODE = new Map<string, OrderableTestSummary>();
const EMPTY_FULL_TESTS: OrderableTest[] = [];
const EMPTY_FULL_BY_CODE = new Map<string, OrderableTest>();

function mapApiAnalytes(analytes?: ApiAnalyteSummary[]): AnalyteDefinition[] | undefined {
  if (!analytes || analytes.length === 0) return undefined;

  return analytes.map((item): AnalyteDefinition => {
    const def = item.definition && typeof item.definition === 'object' ? item.definition : {};
    const merged = { ...def, ...item };
    const valueType = (merged as { value_type?: string }).value_type;
    let type: 'numeric' | 'text' | 'qualitative' | 'select' = 'text';
    if (valueType === 'NUMERIC') type = 'numeric';
    else if (valueType === 'SELECT') type = 'select';
    else if (valueType === 'TEXT') type = 'text';

    let referenceRangeText = '';
    const catalogRefRange = (merged as { reference_range?: CatalogReferenceRange }).reference_range;
    if (catalogRefRange) {
      const range =
        catalogRefRange.adult_general ||
        catalogRefRange.adult_male ||
        catalogRefRange.adult_female;
      if (range) {
        if (range.text?.trim()) {
          referenceRangeText = range.text.trim();
        } else if (range.low !== undefined && range.high !== undefined) {
          referenceRangeText = `${range.low} - ${range.high}`;
        } else if (range.low !== undefined) {
          referenceRangeText = `> ${range.low}`;
        } else if (range.high !== undefined) {
          referenceRangeText = `< ${range.high}`;
        }
      }
    }

    const crit = (merged as { critical_range?: { low?: number; high?: number } }).critical_range;
    const phys = (merged as { physiologic_range?: { min?: number; max?: number } }).physiologic_range;
    const physRange =
      phys?.min !== undefined && phys?.max !== undefined
        ? { min: phys.min, max: phys.max }
        : undefined;
    return {
      code: item.analyteCode,
      name: item.name,
      unit: item.unit || '',
      type,
      loincCode: item.loincCode ?? undefined,
      referenceRange: referenceRangeText,
      valueType: valueType as AnalyteDefinition['valueType'],
      catalogReferenceRange: catalogRefRange,
      criticalLow: crit?.low,
      criticalHigh: crit?.high,
      allowedValues: (merged as { allowed_values?: string[] }).allowed_values,
      decimalsSuggested: (merged as { decimals_suggested?: number }).decimals_suggested,
      decimalPlaces: (merged as { decimals_suggested?: number }).decimals_suggested,
      physiologicRange: physRange,
    };
  });
}

function transformSummary(apiTest: ApiOrderableTestSummaryResponse): OrderableTestSummary {
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
    workups: workupIdsForTest(apiTest.code),
    loincCode: apiTest.loincCode ?? undefined,
    fastingRequired: apiTest.fastingRequired ?? undefined,
  };
}

function transformOrderableTest(apiTest: APIOrderableTestResponse): OrderableTest {
  const { analytes, turnaroundTimeHours, ...rest } = apiTest;
  return {
    ...(rest as unknown as OrderableTest),
    turnaroundTime: turnaroundTimeHours ?? 0,
    workups: workupIdsForTest(apiTest.code),
    analytes: mapApiAnalytes(analytes),
  };
}

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
    return apiTests.map(transformSummary);
  },

  async getByCode(testCode: string): Promise<OrderableTest | null> {
    try {
      const apiTest = await apiClient.get<APIOrderableTestResponse>(`/orderable-tests/${testCode}`);
      return transformOrderableTest(apiTest);
    } catch {
      return null;
    }
  },

  async getByCodes(codes: string[]): Promise<OrderableTest[]> {
    if (codes.length === 0) return [];
    const apiTests = expectArray<APIOrderableTestResponse>(
      await apiClient.get<APIOrderableTestResponse[]>('/orderable-tests/by-codes', {
        codes: codes.join(','),
      }),
      'catalog by-codes'
    );
    return apiTests.map(transformOrderableTest);
  },

  async search(query: string): Promise<OrderableTest[]> {
    const apiTests = expectArray<APIOrderableTestResponse>(
      await apiClient.get<APIOrderableTestResponse[]>('/orderable-tests/search', { q: query }),
      'catalog search'
    );
    return apiTests.map(transformOrderableTest);
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
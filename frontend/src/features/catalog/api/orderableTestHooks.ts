/**
 * Secondary React Query hooks built on {@link useOrderableTests}.
 */
import { resolveWorkupLabel } from '@/types/generated/workups';
import type { TestCategory } from '@/types';
import { queryKeys, useInvalidateQueryKey } from '@/lib/query';
import { useOrderableTests } from './orderableTests';

export function useOrderableTestSearch(searchQuery: string) {
  const { tests, isLoading } = useOrderableTests();

  const results = searchQuery.trim()
    ? tests.filter(test => {
        const query = searchQuery.toLowerCase();
        return (
          test.name.toLowerCase().includes(query) ||
          test.code.toLowerCase().includes(query) ||
          test.synonyms?.some(syn => syn.toLowerCase().includes(query)) ||
          (test.loincCode?.toLowerCase().includes(query) ?? false) ||
          test.workups?.some(
            workupId =>
              workupId.toLowerCase().includes(query) ||
              resolveWorkupLabel(workupId).toLowerCase().includes(query)
          )
        );
      })
    : tests;

  return {
    results,
    isSearching: isLoading,
    totalCount: tests.length,
  };
}

export function useOrderableTestsByCategory(category: TestCategory | undefined) {
  const { tests, isLoading } = useOrderableTests();

  const filteredTests = category
    ? tests.filter(test => test.category === category && test.isActive)
    : tests.filter(test => test.isActive);

  return {
    tests: filteredTests,
    isLoading,
  };
}

export function useActiveOrderableTests() {
  const { tests, isLoading } = useOrderableTests();

  const activeTests = tests.filter(test => test.isActive);

  return {
    tests: activeTests,
    isLoading,
    count: activeTests.length,
  };
}

export function useOrderableTestNameLookup() {
  const { getTest, getTestName, isLoading } = useOrderableTests();
  return { getTestName, getTest, isLoading };
}

export function useInvalidateOrderableTests() {
  const { invalidateAll: invalidate } = useInvalidateQueryKey(queryKeys.orderableTests.all);
  return { invalidate };
}
/**
 * Test Catalog Query Hook
 * 
 * Provides access to the test catalog with Infinity caching.
 * Test catalog data rarely changes (admin updates only), so we cache it
 * for the entire session without automatic refetching.
 * 
 * @module hooks/queries/useTestCatalog
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/query';
import { testAPI } from '@/services/api';
import { useAuth } from '@/features/auth/useAuth';
import type { Test, TestCategory } from '@/types';

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
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.tests.all,
    queryFn: () => testAPI.getAll(),
    enabled: isAuthenticated, // Only fetch when authenticated
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
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.tests.byCode(testCode ?? ''),
    queryFn: () => testAPI.getByCode(testCode!),
    enabled: isAuthenticated && !!testCode, // Only fetch when authenticated
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

  const getTestName = (testCode: string): string => {
    const test = tests.find(t => t.code === testCode);
    return test?.name ?? testCode;
  };

  const getTest = (testCode: string): Test | undefined => {
    return tests.find(t => t.code === testCode);
  };

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
  const queryClient = useQueryClient();

  const invalidate = () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.tests.all });
  };

  return { invalidate };
}

/**
 * Tests Provider Component
 * 
 * MIGRATION NOTE: This provider now delegates to TanStack Query hooks.
 * It maintains backward compatibility for components still using useTests() context.
 * 
 * New components should use the query hooks directly:
 * - useTestCatalog() for fetching tests
 * - useTestSearch() for searching
 * - useTestsByCategory() for filtering by category
 * - useTestNameLookup() for resolving test codes to names
 * 
 * This provider will be deprecated once all consumers are migrated.
 */

import React, { type ReactNode, useCallback, useMemo } from 'react';
import type { Test, TestCategory } from '@/types';
import { TestsContext, type TestsContextType, type TestError } from './TestsContext';
import { useTestCatalog, useInvalidateTestCatalog } from '@/hooks/queries';
import { testAPI } from '@/services/api';

interface TestsProviderProps {
  children: ReactNode;
}

/**
 * TestsProvider - Backward compatible wrapper around TanStack Query
 * 
 * Delegates data fetching to useTestCatalog() hook which provides:
 * - Infinity caching (data fetched once per session)
 * - Request deduplication
 * - Automatic error handling
 */
export const TestsProvider: React.FC<TestsProviderProps> = ({ children }) => {
  // Delegate to TanStack Query hook for data fetching
  const { tests, isLoading: loading, isError, error: queryError, refetch } = useTestCatalog();
  const { invalidate } = useInvalidateTestCatalog();

  // Format error for backward compatibility
  const error: TestError | null = useMemo(() => {
    if (!isError) return null;
    return {
      message: queryError instanceof Error ? queryError.message : 'Failed to load tests',
      operation: 'load',
    };
  }, [isError, queryError]);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    // With TanStack Query, errors are cleared on successful refetch
    // We can trigger a refetch to attempt recovery
  }, []);

  /**
   * Refresh tests - delegates to TanStack Query invalidation
   */
  const refreshTests = useCallback(async () => {
    await invalidate();
    await refetch();
  }, [invalidate, refetch]);

  /**
   * Add a new test (admin only)
   */
  const addTest = useCallback(async (test: Test) => {
    try {
      await testAPI.create(test);
      await refreshTests();
    } catch (err) {
      console.error('Failed to create test:', err);
      throw err;
    }
  }, [refreshTests]);

  /**
   * Update an existing test (admin only)
   */
  const updateTest = useCallback(async (code: string, updates: Partial<Test>) => {
    try {
      await testAPI.update(code, updates);
      await refreshTests();
    } catch (err) {
      console.error('Failed to update test:', err);
      throw err;
    }
  }, [refreshTests]);

  /**
   * Delete a test (mark as inactive)
   */
  const deleteTest = useCallback(async (code: string) => {
    await updateTest(code, { isActive: false });
  }, [updateTest]);

  /**
   * Get a test by code
   */
  const getTest = useCallback((code: string): Test | undefined => {
    return tests.find(test => test.code === code);
  }, [tests]);

  /**
   * Get tests by category
   */
  const getTestsByCategory = useCallback((category: TestCategory): Test[] => {
    return tests.filter(test => test.category === category && test.isActive);
  }, [tests]);

  /**
   * Get only active tests
   */
  const getActiveTests = useCallback((): Test[] => {
    return tests.filter(test => test.isActive);
  }, [tests]);

  /**
   * Search tests by name, code, synonyms, LOINC codes, or panels
   */
  const searchTests = useCallback((query: string): Test[] => {
    if (!query.trim()) return tests.filter(t => t.isActive);

    const lowerQuery = query.toLowerCase();
    return tests.filter(test => {
      if (!test.isActive) return false;

      // Search in name
      if (test.name.toLowerCase().includes(lowerQuery)) return true;

      // Search in code
      if (test.code.toLowerCase().includes(lowerQuery)) return true;

      // Search in synonyms
      if (test.synonyms?.some(syn => syn.toLowerCase().includes(lowerQuery))) return true;

      // Search in LOINC codes
      if (test.loincCodes?.some(loinc => loinc.toLowerCase().includes(lowerQuery))) return true;

      // Search in panels
      if (test.panels?.some(panel => panel.toLowerCase().includes(lowerQuery))) return true;

      return false;
    });
  }, [tests]);

  /**
   * Search tests by synonym
   */
  const searchBySynonym = useCallback((synonym: string): Test[] => {
    if (!synonym.trim()) return [];

    const lowerSynonym = synonym.toLowerCase();
    return tests.filter(test =>
      test.isActive &&
      test.synonyms?.some(syn => syn.toLowerCase().includes(lowerSynonym))
    );
  }, [tests]);

  /**
   * Get tests by panel name
   */
  const getTestsByPanel = useCallback((panelName: string): Test[] => {
    if (!panelName.trim()) return [];

    const lowerPanel = panelName.toLowerCase();
    return tests.filter(test =>
      test.isActive &&
      test.panels?.some(panel => panel.toLowerCase().includes(lowerPanel))
    );
  }, [tests]);

  /**
   * Get test by LOINC code
   */
  const getTestByLoincCode = useCallback((loincCode: string): Test | undefined => {
    if (!loincCode.trim()) return undefined;

    const lowerLoinc = loincCode.toLowerCase();
    return tests.find(test =>
      test.isActive &&
      test.loincCodes?.some(loinc => loinc.toLowerCase() === lowerLoinc)
    );
  }, [tests]);

  /**
   * Get tests by sample type requirements
   */
  const getTestsBySampleRequirements = useCallback((sampleType: string): Test[] => {
    if (!sampleType.trim()) return [];

    const lowerSampleType = sampleType.toLowerCase();
    return tests.filter(test =>
      test.isActive &&
      test.sampleType.toLowerCase() === lowerSampleType
    );
  }, [tests]);

  /**
   * Update test price (custom pricing override)
   */
  const updateTestPrice = useCallback(async (code: string, price: number) => {
    if (price < 0) {
      console.warn('Price cannot be negative');
      return;
    }
    await updateTest(code, { price });
  }, [updateTest]);

  /**
   * Toggle test active status
   */
  const toggleTestActive = useCallback(async (code: string) => {
    const test = tests.find(t => t.code === code);
    if (test) {
      await updateTest(code, { isActive: !test.isActive });
    }
  }, [tests, updateTest]);

  const value: TestsContextType = {
    tests,
    loading,
    error,
    refreshTests,
    addTest,
    updateTest,
    deleteTest,
    getTest,
    getTestsByCategory,
    getActiveTests,
    searchTests,
    toggleTestActive,
    searchBySynonym,
    getTestsByPanel,
    getTestByLoincCode,
    getTestsBySampleRequirements,
    updateTestPrice,
    clearError,
  };

  return <TestsContext.Provider value={value}>{children}</TestsContext.Provider>;
};

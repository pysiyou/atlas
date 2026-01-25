/**
 * useOrderTestSelection
 *
 * Encapsulates test search, filtered list, and toggle (including edit-mode guard
 * for tests with results). Selected tests live in form state; this hook manages
 * search UI and toggle behavior.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useActiveTests, useTestSearch } from '@/hooks/queries';
import type { Order, Test } from '@/types';

export interface UseOrderTestSelectionArgs {
  selectedTests: string[];
  updateField: (field: 'selectedTests', value: string[]) => void;
  isEditMode: boolean;
  existingOrder?: Order;
}

export interface UseOrderTestSelectionReturn {
  testSearch: string;
  setTestSearch: (value: string) => void;
  filteredTests: Test[];
  toggleTest: (testCode: string) => void;
  activeTests: Test[];
  isLoading: boolean;
}

export function useOrderTestSelection({
  selectedTests,
  updateField,
  isEditMode,
  existingOrder,
}: UseOrderTestSelectionArgs): UseOrderTestSelectionReturn {
  const [testSearch, setTestSearch] = useState('');

  const { tests: activeTests, isLoading } = useActiveTests();
  const { results: filteredTestsFromSearch } = useTestSearch(testSearch);

  const filteredTests = testSearch
    ? filteredTestsFromSearch.slice(0, 10)
    : activeTests.slice(0, 10);

  const toggleTest = (testCode: string) => {
    if (isEditMode && existingOrder) {
      const existingTest = existingOrder.tests.find(t => t.testCode === testCode);
      if (existingTest?.results) {
        toast.error('Cannot remove test that has results entered');
        return;
      }
    }
    updateField(
      'selectedTests',
      selectedTests.includes(testCode)
        ? selectedTests.filter(t => t !== testCode)
        : [...selectedTests, testCode]
    );
  };

  return {
    testSearch,
    setTestSearch,
    filteredTests,
    toggleTest,
    activeTests,
    isLoading,
  };
}

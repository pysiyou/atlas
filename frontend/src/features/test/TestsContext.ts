/**
 * Tests Context Definition
 * Separate file for context to support Fast Refresh
 */

import { createContext, useContext } from 'react';
import type { Test, TestCategory } from '@/types';

/**
 * Error state for test operations
 */
export interface TestError {
  message: string;
  code?: string;
  operation?: 'load' | 'create' | 'update' | 'delete';
}

/**
 * TestsContext type definition
 */
export interface TestsContextType {
  /** List of all tests */
  tests: Test[];
  /** Loading state for async operations */
  loading: boolean;
  /** Error state for failed operations */
  error: TestError | null;
  /** Refresh tests from backend */
  refreshTests: () => Promise<void>;
  /** Add a new test */
  addTest: (test: Test) => Promise<void>;
  /** Update an existing test */
  updateTest: (code: string, updates: Partial<Test>) => Promise<void>;
  /** Delete a test (mark as inactive) */
  deleteTest: (code: string) => Promise<void>;
  /** Get a test by code */
  getTest: (code: string) => Test | undefined;
  /** Get tests by category */
  getTestsByCategory: (category: TestCategory) => Test[];
  /** Get only active tests */
  getActiveTests: () => Test[];
  /** Search tests by name, code, synonyms, LOINC codes, or panels */
  searchTests: (query: string) => Test[];
  /** Toggle test active status */
  toggleTestActive: (code: string) => Promise<void>;

  // Enhanced search methods
  searchBySynonym: (synonym: string) => Test[];
  getTestsByPanel: (panelName: string) => Test[];
  getTestByLoincCode: (loincCode: string) => Test | undefined;
  getTestsBySampleRequirements: (sampleType: string) => Test[];
  updateTestPrice: (code: string, price: number) => Promise<void>;

  /** Clear any error state */
  clearError: () => void;
}

/**
 * React Context for Tests
 */
export const TestsContext = createContext<TestsContextType | undefined>(undefined);

/**
 * Hook to access the Tests context
 * @throws Error if used outside of TestsProvider
 */
export function useTests(): TestsContextType {
  const context = useContext(TestsContext);
  if (!context) {
    throw new Error('useTests must be used within a TestsProvider');
  }
  return context;
}

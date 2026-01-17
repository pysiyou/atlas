/**
 * Tests Context Definition
 * Separate file for context to support Fast Refresh
 */

import { createContext } from 'react';
import type { Test, TestCategory } from '@/types';

/**
 * TestsContext type definition
 */
export interface TestsContextType {
  tests: Test[];
  addTest: (test: Test) => void;
  updateTest: (code: string, updates: Partial<Test>) => void;
  deleteTest: (code: string) => void;
  getTest: (code: string) => Test | undefined;
  getTestsByCategory: (category: TestCategory) => Test[];
  getActiveTests: () => Test[];
  searchTests: (query: string) => Test[];
  toggleTestActive: (code: string) => void;
  
  // Enhanced search methods
  searchBySynonym: (synonym: string) => Test[];
  getTestsByPanel: (panelName: string) => Test[];
  getTestByLoincCode: (loincCode: string) => Test | undefined;
  getTestsBySampleRequirements: (sampleType: string) => Test[];
  updateTestPrice: (code: string, price: number) => void;
}

/**
 * React Context for Tests
 */
export const TestsContext = createContext<TestsContextType | undefined>(undefined);

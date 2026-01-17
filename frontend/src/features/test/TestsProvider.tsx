/**
 * Tests Provider Component
 * Manages test catalog and operations
 */

import React, { type ReactNode, useCallback, useState } from 'react';
import type { Test, TestCategory } from '@/types';
import { TestsContext, type TestsContextType } from './TestsContext';

interface TestsProviderProps {
  children: ReactNode;
}

export const TestsProvider: React.FC<TestsProviderProps> = ({ children }) => {
  const [tests, setTests] = useState<Test[]>([]);

  /**
   * Add a new test
   */
  const addTest = useCallback((test: Test) => {
    setTests(prev => [...prev, test]);
  }, [setTests]);

  /**
   * Update an existing test
   */
  const updateTest = useCallback((code: string, updates: Partial<Test>) => {
    setTests(prev => 
      prev.map(test => 
        test.code === code 
          ? { ...test, ...updates, updatedAt: new Date().toISOString() } 
          : test
      )
    );
  }, [setTests]);

  /**
   * Delete a test (mark as inactive instead)
   */
  const deleteTest = useCallback((code: string) => {
    updateTest(code, { isActive: false });
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
    if (!query.trim()) return getActiveTests();
    
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
  }, [tests, getActiveTests]);

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
  const updateTestPrice = useCallback((code: string, price: number) => {
    if (price < 0) {
      console.warn('Price cannot be negative');
      return;
    }
    updateTest(code, { price, updatedAt: new Date().toISOString() });
  }, [updateTest]);

  /**
   * Toggle test active status
   */
  const toggleTestActive = useCallback((code: string) => {
    setTests(prev => 
      prev.map(test => 
        test.code === code 
          ? { ...test, isActive: !test.isActive, updatedAt: new Date().toISOString() }
          : test
      )
    );
  }, [setTests]);

  const value: TestsContextType = {
    tests,
    addTest,
    updateTest,
    deleteTest,
    getTest,
    getTestsByCategory,
    getActiveTests,
    searchTests,
    toggleTestActive,
    // New enhanced methods
    searchBySynonym,
    getTestsByPanel,
    getTestByLoincCode,
    getTestsBySampleRequirements,
    updateTestPrice,
  };

  return <TestsContext.Provider value={value}>{children}</TestsContext.Provider>;
};

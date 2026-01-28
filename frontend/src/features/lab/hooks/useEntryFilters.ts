/**
 * useEntryFilters Hook
 * 
 * Manages entry filter state and filtering logic
 */

import { useState, useMemo } from 'react';
import { createLabItemFilter } from '../components/LabWorkflowView';
import type { TestWithContext } from '../types';
import type { TestStatus } from '@/types';

interface UseEntryFiltersOptions {
  tests: TestWithContext[];
}

/**
 * Hook for managing entry filters
 */
export function useEntryFilters({ tests }: UseEntryFiltersOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [sampleTypeFilters, setSampleTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<TestStatus[]>([]);

  const filterTest = useMemo(() => createLabItemFilter<TestWithContext>(), []);

  // Apply date range, sample type, status, then search
  const filteredTests = useMemo(() => {
    let out = tests;

    if (dateRange) {
      const [start, end] = dateRange;
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      out = out.filter(t => {
        const d = (t as { orderDate?: string }).orderDate;
        if (!d) return false;
        const orderDate = new Date(d);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    if (sampleTypeFilters.length > 0) {
      out = out.filter(t => t.sampleType && sampleTypeFilters.includes(t.sampleType));
    }

    if (statusFilters.length > 0) {
      out = out.filter(t => t.status && statusFilters.includes(t.status as TestStatus));
    }

    if (searchQuery.trim()) {
      out = out.filter(t => filterTest(t, searchQuery));
    }

    return out;
  }, [tests, dateRange, sampleTypeFilters, statusFilters, searchQuery, filterTest]);

  return {
    // Filtered results
    filteredTests,
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Date range
    dateRange,
    setDateRange,
    
    // Sample type filters
    sampleTypeFilters,
    setSampleTypeFilters,
    
    // Status filters
    statusFilters,
    setStatusFilters,
  };
}

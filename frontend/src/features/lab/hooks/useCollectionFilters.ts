/**
 * useCollectionFilters Hook
 * 
 * Manages collection filter state and filtering logic
 */

import { useState, useMemo } from 'react';
import type { SampleDisplay } from '../types';
import type { SampleStatus } from '@/types';
import { getTestNames } from '@/utils/typeHelpers';
import { getCollectionRequirements } from '@/utils/sampleHelpers';
import type { Test } from '@/types';

interface UseCollectionFiltersOptions {
  displays: SampleDisplay[];
  getPatientName: (patientId: number) => string;
  tests: Test[];
}

/**
 * Creates a filter function for samples that searches across multiple fields
 */
const createSampleFilter =
  (getPatientName: (patientId: number) => string, tests: Test[]) =>
  (display: SampleDisplay, query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    const sample = display.sample;
    const sampleType = sample?.sampleType;
    const collectionType = sampleType ? getCollectionRequirements(sampleType).collectionType : '';
    const patientName = getPatientName(display.order.patientId);
    const testNames = sample?.testCodes ? getTestNames(sample.testCodes, tests) : [];

    // Search in rejection reasons/notes for rejected samples
    const rejectionReasons =
      sample?.status === 'rejected' && 'rejectionReasons' in sample
        ? (sample.rejectionReasons || []).join(' ').toLowerCase()
        : '';
    const rejectionNotes =
      sample?.status === 'rejected' && 'rejectionNotes' in sample
        ? (sample.rejectionNotes || '').toLowerCase()
        : '';

    // Search in collection notes
    const collectionNotes =
      (sample?.status === 'collected' || sample?.status === 'rejected') &&
      'collectionNotes' in sample
        ? (sample.collectionNotes || '').toLowerCase()
        : '';

    return (
      display.order.orderId.toString().toLowerCase().includes(lowerQuery) ||
      sample?.sampleId?.toString().toLowerCase().includes(lowerQuery) ||
      patientName.toLowerCase().includes(lowerQuery) ||
      sampleType?.toLowerCase()?.includes(lowerQuery) ||
      (collectionType.toLowerCase().includes(lowerQuery) && collectionType !== sampleType) ||
      testNames.some((name: string) => name.toLowerCase().includes(lowerQuery)) ||
      rejectionReasons.includes(lowerQuery) ||
      rejectionNotes.includes(lowerQuery) ||
      collectionNotes.includes(lowerQuery)
    );
  };

/**
 * Hook for managing collection filters
 */
export function useCollectionFilters({ displays, getPatientName, tests }: UseCollectionFiltersOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [sampleTypeFilters, setSampleTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<SampleStatus[]>(['pending']);

  // Create memoized filter function
  const filterSample = useMemo(
    () => createSampleFilter(getPatientName, tests),
    [getPatientName, tests]
  );

  // Apply date range, sample type, status, then search
  const filteredDisplays = useMemo(() => {
    let out = displays;

    if (dateRange) {
      const [start, end] = dateRange;
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      out = out.filter(d => {
        const orderDate = new Date(d.order.orderDate);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    if (sampleTypeFilters.length > 0) {
      out = out.filter(d => {
        const st = d.requirement?.sampleType ?? d.sample?.sampleType;
        return st && sampleTypeFilters.includes(st);
      });
    }

    if (statusFilters.length > 0) {
      out = out.filter(d => d.sample?.status && statusFilters.includes(d.sample.status));
    }

    if (searchQuery.trim()) {
      out = out.filter(d => filterSample(d, searchQuery));
    }

    return out;
  }, [displays, dateRange, sampleTypeFilters, statusFilters, searchQuery, filterSample]);

  return {
    // Filtered results
    filteredDisplays,
    
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

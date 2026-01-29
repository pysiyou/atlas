/**
 * useLabWorkflowFilters - Shared filter state and apply logic for lab workflow views
 * Encapsulates date range, sample type, status, and search filtering.
 */

import { useState, useMemo } from 'react';

export interface UseLabWorkflowFiltersOptions<T, S> {
  items: T[];
  getOrderDate: (item: T) => string | undefined;
  getSampleType: (item: T) => string | undefined;
  getStatus: (item: T) => S | undefined;
  searchFilterFn: (item: T, query: string) => boolean;
  initialStatusFilters?: S[];
}

function applyDateRange<T>(out: T[], dateRange: [Date, Date] | null, getOrderDate: (item: T) => string | undefined): T[] {
  if (!dateRange) return out;
  const [start, end] = dateRange;
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  return out.filter(item => {
    const d = getOrderDate(item);
    if (!d) return false;
    const orderDate = new Date(d);
    return orderDate >= startDate && orderDate <= endDate;
  });
}

export function useLabWorkflowFilters<T, S>({
  items,
  getOrderDate,
  getSampleType,
  getStatus,
  searchFilterFn,
  initialStatusFilters = [],
}: UseLabWorkflowFiltersOptions<T, S>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [sampleTypeFilters, setSampleTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<S[]>(initialStatusFilters);

  const filteredItems = useMemo(() => {
    let out = items;
    out = applyDateRange(out, dateRange, getOrderDate);
    if (sampleTypeFilters.length > 0) {
      out = out.filter(item => {
        const st = getSampleType(item);
        return st && sampleTypeFilters.includes(st);
      });
    }
    if (statusFilters.length > 0) {
      out = out.filter(item => {
        const s = getStatus(item);
        return s != null && statusFilters.includes(s);
      });
    }
    if (searchQuery.trim()) {
      out = out.filter(item => searchFilterFn(item, searchQuery));
    }
    return out;
  }, [items, dateRange, sampleTypeFilters, statusFilters, searchQuery, getOrderDate, getSampleType, getStatus, searchFilterFn]);

  return {
    filteredItems,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    sampleTypeFilters,
    setSampleTypeFilters,
    statusFilters,
    setStatusFilters,
  };
}

/**
 * useLabWorkflowFilters - Shared filter state and apply logic for lab workflow views
 * Encapsulates date range, sample type, status, and search filtering.
 */

import { useState, useMemo } from 'react';
import { compareQueuePriority } from '../utils/compareQueuePriority';

export interface UseLabWorkflowFiltersOptions<T, S> {
  items: T[];
  getOrderDate: (item: T) => string | undefined;
  getSampleType: (item: T) => string | undefined;
  getStatus: (item: T) => S | undefined;
  searchFilterFn: (item: T, query: string) => boolean;
  initialStatusFilters?: S[];
  /** Pre-fill search from URL query param (e.g. cross-links from order detail). */
  initialSearchQuery?: string;
  /** Sort by priority (urgent first) then oldest queue timestamp. */
  sortByQueuePriority?: boolean;
  getPriority?: (item: T) => string | undefined;
  getQueueSince?: (item: T) => string | undefined;
}

export interface LabQueueFilterState<S> {
  searchQuery: string;
  dateRange: [Date, Date] | null;
  sampleTypeFilters: string[];
  statusFilters: S[];
}

function applyDateRange<T>(
  out: T[],
  dateRange: [Date, Date] | null,
  getOrderDate: (item: T) => string | undefined
): T[] {
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

/** Apply the same lab queue filters used by workflow views (search, date, sample type, priority). */
export function applyLabQueueFilters<T, S>({
  items,
  filters,
  getOrderDate,
  getSampleType,
  getStatus,
  searchFilterFn,
  sortByQueuePriority = false,
  getPriority,
  getQueueSince,
  applyStatusFilter = true,
}: {
  items: T[];
  filters: LabQueueFilterState<S>;
  getOrderDate: (item: T) => string | undefined;
  getSampleType: (item: T) => string | undefined;
  getStatus: (item: T) => S | undefined;
  searchFilterFn: (item: T, query: string) => boolean;
  sortByQueuePriority?: boolean;
  getPriority?: (item: T) => string | undefined;
  getQueueSince?: (item: T) => string | undefined;
  /** When false, priority/status filters are skipped (e.g. recollection requests without priority). */
  applyStatusFilter?: boolean;
}): T[] {
  let out = items;
  out = applyDateRange(out, filters.dateRange, getOrderDate);
  if (filters.sampleTypeFilters.length > 0) {
    out = out.filter(item => {
      const st = getSampleType(item);
      return st && filters.sampleTypeFilters.includes(st);
    });
  }
  if (applyStatusFilter && filters.statusFilters.length > 0) {
    out = out.filter(item => {
      const s = getStatus(item);
      return s != null && filters.statusFilters.includes(s);
    });
  }
  if (filters.searchQuery.trim()) {
    out = out.filter(item => searchFilterFn(item, filters.searchQuery));
  }
  if (sortByQueuePriority && getPriority && getQueueSince) {
    out = [...out].sort((a, b) =>
      compareQueuePriority(getPriority(a), getPriority(b), getQueueSince(a), getQueueSince(b))
    );
  }
  return out;
}

export function useLabWorkflowFilters<T, S>({
  items,
  getOrderDate,
  getSampleType,
  getStatus,
  searchFilterFn,
  initialStatusFilters = [],
  initialSearchQuery = '',
  sortByQueuePriority = false,
  getPriority,
  getQueueSince,
}: UseLabWorkflowFiltersOptions<T, S>) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [sampleTypeFilters, setSampleTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<S[]>(initialStatusFilters);

  const filterState = useMemo<LabQueueFilterState<S>>(
    () => ({
      searchQuery,
      dateRange,
      sampleTypeFilters,
      statusFilters,
    }),
    [searchQuery, dateRange, sampleTypeFilters, statusFilters]
  );

  const filteredItems = useMemo(
    () =>
      applyLabQueueFilters({
        items,
        filters: filterState,
        getOrderDate,
        getSampleType,
        getStatus,
        searchFilterFn,
        sortByQueuePriority,
        getPriority,
        getQueueSince,
      }),
    [
      items,
      filterState,
      getOrderDate,
      getSampleType,
      getStatus,
      searchFilterFn,
      sortByQueuePriority,
      getPriority,
      getQueueSince,
    ]
  );

  return {
    filteredItems,
    filterState,
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

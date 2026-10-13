/**
 * LabQueueFilters - Shared filter row for lab workflow tabs
 * Composes FilterBar with lab filter config; used by Entry, Collection, Validation, Escalation.
 */

import React, { useMemo } from 'react';
import { FilterBar, type FilterValues } from '@/components/filters';
import type { FilterConfig } from '@/components/filters';

export interface LabQueueFiltersProps<S = string[]> {
  config: FilterConfig;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  sampleTypeFilters: string[];
  onSampleTypeFiltersChange: (values: string[]) => void;
  statusFilters: S;
  onStatusFiltersChange: (values: S) => void;
  /** Key for status filter in config - defaults to 'status', use 'priority' for validation */
  statusFilterKey?: 'status' | 'priority';
}

export function LabQueueFilters<S = string[]>({
  config,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  sampleTypeFilters,
  onSampleTypeFiltersChange,
  statusFilters,
  onStatusFiltersChange,
  statusFilterKey = 'status',
}: LabQueueFiltersProps<S>): React.ReactElement {
  const filterValues = useMemo<FilterValues>(
    () => ({
      searchQuery,
      dateRange,
      sampleType: sampleTypeFilters,
      [statusFilterKey]: statusFilters,
    }),
    [searchQuery, dateRange, sampleTypeFilters, statusFilters, statusFilterKey]
  );

  const handleFilterChange = (filters: FilterValues) => {
    if (filters.searchQuery !== undefined) onSearchChange(filters.searchQuery as string);
    if (filters.dateRange !== undefined)
      onDateRangeChange(filters.dateRange as [Date, Date] | null);
    if (filters.sampleType !== undefined) onSampleTypeFiltersChange(filters.sampleType as string[]);
    // Support both 'status' and 'priority' keys
    if (filters.status !== undefined) onStatusFiltersChange(filters.status as S);
    if (filters.priority !== undefined) onStatusFiltersChange(filters.priority as S);
  };

  return <FilterBar config={config} value={filterValues} onChange={handleFilterChange} />;
}

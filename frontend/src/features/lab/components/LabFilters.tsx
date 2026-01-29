/**
 * LabFilters - Shared filter row for lab workflow tabs
 * Composes FilterBar with lab filter config; used by Entry, Collection, Validation, Escalation.
 */

import React, { useMemo } from 'react';
import { FilterBar, type FilterValues } from '@/features/filters';
import type { FilterConfig } from '@/features/filters';

export interface LabFiltersProps<S = string[]> {
  config: FilterConfig;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  sampleTypeFilters: string[];
  onSampleTypeFiltersChange: (values: string[]) => void;
  statusFilters: S;
  onStatusFiltersChange: (values: S) => void;
}

export function LabFilters<S = string[]>({
  config,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  sampleTypeFilters,
  onSampleTypeFiltersChange,
  statusFilters,
  onStatusFiltersChange,
}: LabFiltersProps<S>): React.ReactElement {
  const filterValues = useMemo<FilterValues>(
    () => ({
      searchQuery,
      dateRange,
      sampleType: sampleTypeFilters,
      status: statusFilters,
    }),
    [searchQuery, dateRange, sampleTypeFilters, statusFilters]
  );

  const handleFilterChange = (filters: FilterValues) => {
    if (filters.searchQuery !== undefined) onSearchChange(filters.searchQuery as string);
    if (filters.dateRange !== undefined) onDateRangeChange(filters.dateRange as [Date, Date] | null);
    if (filters.sampleType !== undefined) onSampleTypeFiltersChange(filters.sampleType as string[]);
    if (filters.status !== undefined) onStatusFiltersChange(filters.status as S);
  };

  return <FilterBar config={config} value={filterValues} onChange={handleFilterChange} />;
}

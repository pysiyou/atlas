/**
 * EntryFilters Component
 *
 * Filter row for result entry tab. Uses FilterBar – same structure as Order.
 * Search, date range, sample type, status.
 *
 * @module features/lab
 */

import React, { useMemo } from 'react';
import { FilterBar, type FilterValues } from '@/features/filters';
import { entryFilterConfig } from '../constants';
import type { TestStatus } from '@/types';

export interface EntryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  sampleTypeFilters: string[];
  onSampleTypeFiltersChange: (values: string[]) => void;
  statusFilters: TestStatus[];
  onStatusFiltersChange: (values: TestStatus[]) => void;
}

/**
 * Composes FilterBar with entry-specific configuration.
 */
export const EntryFilters: React.FC<EntryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  sampleTypeFilters,
  onSampleTypeFiltersChange,
  statusFilters,
  onStatusFiltersChange,
}) => {
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
    if (filters.status !== undefined) onStatusFiltersChange(filters.status as TestStatus[]);
  };

  return (
    <FilterBar config={entryFilterConfig} value={filterValues} onChange={handleFilterChange} />
  );
};

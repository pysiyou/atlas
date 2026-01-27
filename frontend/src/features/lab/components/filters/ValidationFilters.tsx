/**
 * ValidationFilters Component
 *
 * Filter row for result validation tab. Uses FilterBar – same structure as Order.
 * Search, date range, sample type, status (priority).
 *
 * @module features/lab
 */

import React, { useMemo } from 'react';
import { FilterBar, type FilterValues } from '@/features/filters';
import { validationFilterConfig } from '../../constants';
import type { PriorityLevel } from '@/types';

export interface ValidationFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  sampleTypeFilters: string[];
  onSampleTypeFiltersChange: (values: string[]) => void;
  statusFilters: PriorityLevel[];
  onStatusFiltersChange: (values: PriorityLevel[]) => void;
}

/**
 * Composes FilterBar with validation-specific configuration.
 */
export const ValidationFilters: React.FC<ValidationFiltersProps> = ({
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
    if (filters.status !== undefined) onStatusFiltersChange(filters.status as PriorityLevel[]);
  };

  return (
    <FilterBar
      config={validationFilterConfig}
      value={filterValues}
      onChange={handleFilterChange}
    />
  );
};

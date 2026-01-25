/**
 * CollectionFilters Component
 *
 * Filter row for sample collection tab. Uses FilterBar – same structure as Order.
 * Search, date range, sample type, status.
 *
 * @module features/lab
 */

import React, { useMemo } from 'react';
import { FilterBar, type FilterValues } from '@/features/filters';
import { collectionFilterConfig } from '../../config/collectionFilterConfig';
import type { SampleStatus } from '@/types';

export interface CollectionFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  sampleTypeFilters: string[];
  onSampleTypeFiltersChange: (values: string[]) => void;
  statusFilters: SampleStatus[];
  onStatusFiltersChange: (values: SampleStatus[]) => void;
}

/**
 * Composes FilterBar with collection-specific configuration.
 */
export const CollectionFilters: React.FC<CollectionFiltersProps> = ({
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
    if (filters.status !== undefined) onStatusFiltersChange(filters.status as SampleStatus[]);
  };

  return (
    <FilterBar config={collectionFilterConfig} value={filterValues} onChange={handleFilterChange} />
  );
};

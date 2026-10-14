/**
 * PatientFilters — FilterBar wrapper keeping the list-page prop interface.
 */

import React, { useMemo } from 'react';
import { FilterBar, type FilterValues } from '@/components/filters';
import { patientFilterConfig } from '../config/patientFilters.config';
import type { Gender } from '@/types';

export interface PatientFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  ageRange: [number, number];
  onAgeRangeChange: (range: [number, number]) => void;
  sexFilters: Gender[];
  onSexFiltersChange: (values: Gender[]) => void;
  /** Kept for call-site compatibility; FilterBar age control does not consume it. */
  ageHistogram?: number[];
}

export const PatientFilters: React.FC<PatientFiltersProps> = ({
  searchQuery,
  onSearchChange,
  ageRange,
  onAgeRangeChange,
  sexFilters,
  onSexFiltersChange,
}) => {
  const filterValues = useMemo<FilterValues>(
    () => ({
      search: searchQuery,
      sex: sexFilters,
      ageRange,
    }),
    [searchQuery, sexFilters, ageRange]
  );

  const handleFilterChange = (next: FilterValues) => {
    if (next.search !== undefined && next.search !== searchQuery) {
      onSearchChange((next.search as string) ?? '');
    }
    if (next.sex !== undefined && next.sex !== sexFilters) {
      onSexFiltersChange((next.sex as Gender[]) ?? []);
    }
    if (next.ageRange !== undefined && next.ageRange !== ageRange) {
      onAgeRangeChange(next.ageRange as [number, number]);
    }
  };

  return (
    <FilterBar config={patientFilterConfig} value={filterValues} onChange={handleFilterChange} />
  );
};

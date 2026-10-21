/**
 * PatientFilters — FilterBar wrapper keeping the list-page prop interface.
 */

import React, { useMemo } from 'react';
import { FilterBar, useFilterBarBridge } from '@/components/filters';
import { patientFilterConfig } from '../config/patientFilters.config';
import type { Gender } from '@/types';

export interface PatientFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  ageRange: [number, number];
  onAgeRangeChange: (range: [number, number]) => void;
  sexFilters: Gender[];
  onSexFiltersChange: (values: Gender[]) => void;
}

export const PatientFilters: React.FC<PatientFiltersProps> = ({
  searchQuery,
  onSearchChange,
  ageRange,
  onAgeRangeChange,
  sexFilters,
  onSexFiltersChange,
}) => {
  const value = useMemo(
    () => ({
      search: searchQuery,
      sex: sexFilters,
      ageRange,
    }),
    [searchQuery, sexFilters, ageRange]
  );

  const { filterValues, handleFilterChange } = useFilterBarBridge(value, {
    search: onSearchChange,
    sex: onSexFiltersChange,
    ageRange: onAgeRangeChange,
  });

  return (
    <FilterBar config={patientFilterConfig} value={filterValues} onChange={handleFilterChange} />
  );
};

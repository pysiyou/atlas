/**
 * PatientFilters Component
 * 
 * Provides comprehensive filtering controls for the patients list using the new filter architecture.
 * Uses config-driven approach with FilterBar component.
 * 
 * @module features/patient
 */

import React, { useMemo } from 'react';
import { FilterBar, type FilterValues } from '@/features/filters';
import { patientFilterConfig } from './patientFilterConfig';
import type { Gender } from '@/types';

/**
 * Affiliation status type
 */
export type AffiliationStatus = 'active' | 'inactive';

/**
 * Props interface for PatientFilters component
 */
export interface PatientFiltersProps {
  /** Current search query string */
  searchQuery: string;
  /** Callback fired when search query changes */
  onSearchChange: (value: string) => void;
  /** Currently selected age range [min, max] */
  ageRange: [number, number];
  /** Callback fired when age range changes */
  onAgeRangeChange: (range: [number, number]) => void;
  /** Array of currently selected genders/sexes */
  sexFilters: Gender[];
  /** Callback fired when gender/sex filters change */
  onSexFiltersChange: (values: Gender[]) => void;
  /** Array of currently selected affiliation statuses */
  affiliationStatusFilters: AffiliationStatus[];
  /** Callback fired when affiliation status filters change */
  onAffiliationStatusFiltersChange: (values: AffiliationStatus[]) => void;
}

/**
 * PatientFilters Component
 * 
 * Composes FilterBar with patient-specific configuration.
 * Maps between legacy prop interface and new filter value structure.
 * 
 * @component
 */
export const PatientFilters: React.FC<PatientFiltersProps> = ({
  searchQuery,
  onSearchChange,
  ageRange,
  onAgeRangeChange,
  sexFilters,
  onSexFiltersChange,
  affiliationStatusFilters,
  onAffiliationStatusFiltersChange,
}) => {
  /**
   * Convert props to filter values format
   */
  const filterValues = useMemo<FilterValues>(
    () => ({
      searchQuery,
      ageRange,
      sex: sexFilters,
      affiliationStatus: affiliationStatusFilters,
    }),
    [searchQuery, ageRange, sexFilters, affiliationStatusFilters]
  );

  /**
   * Handle filter changes and map back to props
   */
  const handleFilterChange = (filters: FilterValues) => {
    if (filters.searchQuery !== undefined) {
      onSearchChange(filters.searchQuery as string);
    }
    if (filters.ageRange !== undefined) {
      onAgeRangeChange(filters.ageRange as [number, number]);
    }
    if (filters.sex !== undefined) {
      onSexFiltersChange(filters.sex as Gender[]);
    }
    if (filters.affiliationStatus !== undefined) {
      onAffiliationStatusFiltersChange(filters.affiliationStatus as AffiliationStatus[]);
    }
  };

  return (
    <FilterBar
      config={patientFilterConfig}
      value={filterValues}
      onChange={handleFilterChange}
    />
  );
};

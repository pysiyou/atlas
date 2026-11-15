/**
 * PatientFilters — FilterBar wrapper keeping the list-page prop interface.
 */

import { useMemo } from 'react';
import { FeatureFilterBar } from '@/components/filters';
import { getPatientFilterConfig } from '../config/patientFilters.config';
import { useClientConfig } from '@/app/clientConfigContext';
import type { Gender } from '@/types';

export interface PatientFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  ageRange: [number, number];
  onAgeRangeChange: (range: [number, number]) => void;
  sexFilters: Gender[];
  onSexFiltersChange: (values: Gender[]) => void;
}

export function PatientFilters({
  searchQuery,
  onSearchChange,
  ageRange,
  onAgeRangeChange,
  sexFilters,
  onSexFiltersChange,
}: PatientFiltersProps) {
  useClientConfig();
  const filterConfig = getPatientFilterConfig();
  const value = useMemo(
    () => ({ search: searchQuery, sex: sexFilters, ageRange }),
    [searchQuery, sexFilters, ageRange],
  );

  return (
    <FeatureFilterBar
      config={filterConfig}
      value={value}
      handlers={{
        search: onSearchChange,
        sex: onSexFiltersChange,
        ageRange: onAgeRangeChange,
      }}
    />
  );
}

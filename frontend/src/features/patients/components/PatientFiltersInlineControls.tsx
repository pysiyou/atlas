/**
 * Inline filter controls for PatientFilters (tablet and desktop layouts).
 */

import React from 'react';
import { DebouncedSearchInput, MultiSelectFilter } from '@/components';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import { GENDER_VALUES, GENDER_CONFIG } from '@/types';
import { createFilterOptions } from '@/utils/filtering';
import { PATIENT_FILTER_PLACEHOLDERS } from '@/components/filters';
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from '../constants';
import { AgeFilter } from './AgeFilter';
import type { Gender } from '@/types';
import type { AffiliationStatus } from './PatientFilterTypes';

const genderOptions = createFilterOptions(GENDER_VALUES, GENDER_CONFIG);
const affiliationStatusOptions = [
  { id: 'active', label: 'Active', color: 'success' },
  { id: 'inactive', label: 'Inactive', color: 'default' },
];

export interface PatientFiltersInlineControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  ageRange: [number, number];
  onAgeRangeChange: (range: [number, number]) => void;
  sexFilters: Gender[];
  onSexFiltersChange: (values: Gender[]) => void;
  affiliationStatusFilters: AffiliationStatus[];
  onAffiliationStatusFiltersChange: (values: AffiliationStatus[]) => void;
}

export const PatientFiltersInlineControls: React.FC<PatientFiltersInlineControlsProps> = ({
  searchQuery,
  onSearchChange,
  ageRange,
  onAgeRangeChange,
  sexFilters,
  onSexFiltersChange,
  affiliationStatusFilters,
  onAffiliationStatusFiltersChange,
}) => (
  <>
    <div className={cn('flex', 'h-[34px]', 'w-full items-center')}>
      <DebouncedSearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={PATIENT_FILTER_PLACEHOLDERS.searchLong}
      />
    </div>

    <div className={cn('flex', 'h-[34px]', 'w-full items-center')}>
      <AgeFilter
        value={ageRange}
        onChange={onAgeRangeChange}
        min={AGE_RANGE_MIN}
        max={AGE_RANGE_MAX}
        placeholder={PATIENT_FILTER_PLACEHOLDERS.ageRange}
        className="w-full"
      />
    </div>

    <div className={cn('flex', 'h-[34px]', 'w-full items-center')}>
      <MultiSelectFilter
        label="Sex"
        options={genderOptions}
        selectedIds={sexFilters}
        onChange={values => onSexFiltersChange(values as Gender[])}
        placeholder={PATIENT_FILTER_PLACEHOLDERS.sex}
        selectAllLabel="All genders"
        icon={ICONS.dataFields.userHands}
        className="w-full"
      />
    </div>

    <div className={cn('flex', 'h-[34px]', 'w-full items-center')}>
      <MultiSelectFilter
        label="Affiliation Status"
        options={affiliationStatusOptions}
        selectedIds={affiliationStatusFilters}
        onChange={values => onAffiliationStatusFiltersChange(values as AffiliationStatus[])}
        placeholder={PATIENT_FILTER_PLACEHOLDERS.affiliationStatus}
        selectAllLabel="All statuses"
        icon={ICONS.actions.infoCircle}
        className="w-full"
      />
    </div>
  </>
);

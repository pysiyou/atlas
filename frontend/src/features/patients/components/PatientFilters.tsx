/**
 * PatientFilters Component
 * Responsive filter controls with modal for smaller screens
 */

import React from 'react';
import { CheckboxList, OverlayRangeSlider } from '@/components';
import {
  ResponsiveEntityFilters,
  PATIENT_FILTER_PLACEHOLDERS,
} from '@/components/filters';
import { GENDER_VALUES, GENDER_CONFIG } from '@/types';
import { MODULE_ICONS } from '@/config/icons';
import { createFilterOptions } from '@/utils/filtering';
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from '../constants';
import { PatientFiltersInlineControls } from './PatientFiltersInlineControls';
import type { Gender } from '@/types';
import type { AffiliationStatus } from './PatientFilterTypes';

export type { AffiliationStatus } from './PatientFilterTypes';

const genderOptions = createFilterOptions(GENDER_VALUES, GENDER_CONFIG);
const affiliationStatusOptions = [
  { id: 'active', label: 'Active', color: 'success' },
  { id: 'inactive', label: 'Inactive', color: 'default' },
];

export interface PatientFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  ageRange: [number, number];
  onAgeRangeChange: (range: [number, number]) => void;
  sexFilters: Gender[];
  onSexFiltersChange: (values: Gender[]) => void;
  affiliationStatusFilters: AffiliationStatus[];
  onAffiliationStatusFiltersChange: (values: AffiliationStatus[]) => void;
}

export const PatientFilters: React.FC<PatientFiltersProps> = props => {
  const activeFilterCount =
    (props.ageRange[0] !== AGE_RANGE_MIN || props.ageRange[1] !== AGE_RANGE_MAX ? 1 : 0) +
    props.sexFilters.length +
    props.affiliationStatusFilters.length;

  const modalContent = (
    <>
      <div className="w-full">
        <h4 className="text-sm font-semibold text-text-primary mb-3">Age Range</h4>
        <OverlayRangeSlider
          value={props.ageRange}
          onChange={props.onAgeRangeChange}
          min={AGE_RANGE_MIN}
          max={AGE_RANGE_MAX}
          hint="Move the slider to filter by age"
          formatLabel={v => `${v} years`}
        />
        <div className="border-b border-border-default mt-4" />
      </div>
      <div className="w-full">
        <h4 className="text-sm font-semibold text-text-primary mb-3">Sex</h4>
        <CheckboxList
          options={genderOptions}
          selectedIds={props.sexFilters}
          onChange={values => props.onSexFiltersChange(values as Gender[])}
          columns={genderOptions.length > 4 ? 2 : 1}
        />
        <div className="border-b border-border-default mt-4" />
      </div>
      <div className="w-full">
        <h4 className="text-sm font-semibold text-text-primary mb-3">Affiliation Status</h4>
        <CheckboxList
          options={affiliationStatusOptions}
          selectedIds={props.affiliationStatusFilters}
          onChange={values =>
            props.onAffiliationStatusFiltersChange(values as AffiliationStatus[])
          }
          columns={affiliationStatusOptions.length > 4 ? 2 : 1}
        />
      </div>
    </>
  );

  return (
    <ResponsiveEntityFilters
      searchQuery={props.searchQuery}
      onSearchChange={props.onSearchChange}
      searchPlaceholder={PATIENT_FILTER_PLACEHOLDERS.search}
      activeFilterCount={activeFilterCount}
      inlineControls={<PatientFiltersInlineControls {...props} />}
      modalContent={modalContent}
      footerIcon={MODULE_ICONS.patients}
      footerLabel="Patients"
      onReset={() => {
        props.onAgeRangeChange([AGE_RANGE_MIN, AGE_RANGE_MAX]);
        props.onSexFiltersChange([]);
        props.onAffiliationStatusFiltersChange([]);
      }}
    />
  );
};

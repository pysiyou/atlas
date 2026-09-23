/**
 * PatientFilters Component
 * Responsive filter controls with modal for smaller screens
 */

import React from 'react';
import { FILTER_TYPE } from '@/components/theme/recipes';
import { CheckboxList } from '@/components';
import { AgeRangeSliderPanel } from '@/components/filters';
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
  /** Normalized age histogram for the range slider (0–1 per bucket). */
  ageHistogram?: number[];
}

export const PatientFilters: React.FC<PatientFiltersProps> = props => {
  const activeFilterCount =
    (props.ageRange[0] !== AGE_RANGE_MIN || props.ageRange[1] !== AGE_RANGE_MAX ? 1 : 0) +
    props.sexFilters.length +
    props.affiliationStatusFilters.length;

  const modalContent = (
    <>
      <div className="w-full">
        <h4 className={FILTER_TYPE.sectionTitle}>Age Range</h4>
        <AgeRangeSliderPanel
          value={props.ageRange}
          onChange={props.onAgeRangeChange}
          min={AGE_RANGE_MIN}
          max={AGE_RANGE_MAX}
          histogram={props.ageHistogram}
          onReset={() => props.onAgeRangeChange([AGE_RANGE_MIN, AGE_RANGE_MAX])}
        />
        <div className="border-b border-border-default mt-space-4" />
      </div>
      <div className="w-full">
        <h4 className={FILTER_TYPE.sectionTitle}>Sex</h4>
        <CheckboxList
          options={genderOptions}
          selectedIds={props.sexFilters}
          onChange={values => props.onSexFiltersChange(values as Gender[])}
          columns={genderOptions.length > 4 ? 2 : 1}
        />
        <div className="border-b border-border-default mt-space-4" />
      </div>
      <div className="w-full">
        <h4 className={FILTER_TYPE.sectionTitle}>Affiliation Status</h4>
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

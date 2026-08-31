/**
 * Modal filter panel for PatientFilters on small screens.
 */

import React from 'react';
import { Modal, CheckboxList, OverlaySearchInput, OverlayRangeSlider } from '@/components';
import {
  FilterModalFooter,
  PATIENT_FILTER_PLACEHOLDERS,
} from '@/filters';
import { GENDER_VALUES, GENDER_CONFIG } from '@/types';
import { createFilterOptions } from '@/utils/filtering';
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from '../constants';
import type { Gender } from '@/types';
import type { AffiliationStatus } from './PatientFilterTypes';

const genderOptions = createFilterOptions(GENDER_VALUES, GENDER_CONFIG);
const affiliationStatusOptions = [
  { id: 'active', label: 'Active', color: 'success' },
  { id: 'inactive', label: 'Inactive', color: 'default' },
];

export interface PatientFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  ageRange: [number, number];
  onAgeRangeChange: (range: [number, number]) => void;
  sexFilters: Gender[];
  onSexFiltersChange: (values: Gender[]) => void;
  affiliationStatusFilters: AffiliationStatus[];
  onAffiliationStatusFiltersChange: (values: AffiliationStatus[]) => void;
}

export const PatientFiltersModal: React.FC<PatientFiltersModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  ageRange,
  onAgeRangeChange,
  sexFilters,
  onSexFiltersChange,
  affiliationStatusFilters,
  onAffiliationStatusFiltersChange,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Filter" size="md">
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-6">
          <OverlaySearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={PATIENT_FILTER_PLACEHOLDERS.search}
          />
        </div>

        <div className="space-y-5">
          <div className="w-full">
            <h4 className="text-sm font-semibold text-text-primary mb-3">Age Range</h4>
            <OverlayRangeSlider
              value={ageRange}
              onChange={onAgeRangeChange}
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
              selectedIds={sexFilters}
              onChange={values => onSexFiltersChange(values as Gender[])}
              columns={genderOptions.length > 4 ? 2 : 1}
            />
            <div className="border-b border-border-default mt-4" />
          </div>

          <div className="w-full">
            <h4 className="text-sm font-semibold text-text-primary mb-3">Affiliation Status</h4>
            <CheckboxList
              options={affiliationStatusOptions}
              selectedIds={affiliationStatusFilters}
              onChange={values =>
                onAffiliationStatusFiltersChange(values as AffiliationStatus[])
              }
              columns={affiliationStatusOptions.length > 4 ? 2 : 1}
            />
          </div>
        </div>
      </div>

      <FilterModalFooter
        onReset={() => {
          onAgeRangeChange([AGE_RANGE_MIN, AGE_RANGE_MAX]);
          onSexFiltersChange([]);
          onAffiliationStatusFiltersChange([]);
        }}
        onApply={onClose}
      />
    </div>
  </Modal>
);

/**
 * Patient list filter configuration for FilterBar component.
 */

import type { FilterConfig } from '@/components/filters/types';
import { MODULE_ICONS } from '@/config/icons';
import { createFilterOptions } from '@/utils/filtering';
import { GENDER_VALUES, GENDER_CONFIG } from '@/types';
import { PATIENT_FILTER_PLACEHOLDERS } from '@/components/filters';
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from '../constants';

const genderOptions = createFilterOptions(GENDER_VALUES, GENDER_CONFIG);

const affiliationStatusOptions = [
  { id: 'active', label: 'Active', color: 'success' },
  { id: 'inactive', label: 'Inactive', color: 'default' },
];

export const patientFilterConfig: FilterConfig = {
  footerIcon: MODULE_ICONS.patients,
  footerLabel: 'Patients',
  primaryFilters: {
    title: 'Patient Filters',
    controls: [
      {
        key: 'search',
        type: 'search',
        label: 'Search Patients',
        placeholder: PATIENT_FILTER_PLACEHOLDERS.search,
      },
      {
        key: 'sex',
        type: 'multiSelect',
        label: 'Sex',
        options: genderOptions,
      },
      {
        key: 'affiliationStatus',
        type: 'multiSelect',
        label: 'Affiliation Status',
        options: affiliationStatusOptions,
      },
    ],
  },
  advancedFilters: {
    title: 'Advanced Filters',
    controls: [
      {
        key: 'ageRange',
        type: 'ageRange',
        label: 'Age Range',
        min: AGE_RANGE_MIN,
        max: AGE_RANGE_MAX,
      },
    ],
  },
};

/** Entity filter keys that sync to URL for cross-page navigation. */
export const PATIENT_URL_FILTER_KEYS = ['patientId'] as const;

/**
 * Patient list filter configuration for FilterBar component.
 */

import type { FilterConfig } from '@/components/filters/types';
import { IconKeys } from '@/config/icons';
import { createFilterOptions } from '@/utils/filtering';
import { GENDER_VALUES, GENDER_CONFIG } from '@/types';
import { getPatientFilterPlaceholders } from '@/config/filterPlaceholders';

const PATIENT_FILTER_PLACEHOLDERS = getPatientFilterPlaceholders();
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from '../constants';

const genderOptions = createFilterOptions(GENDER_VALUES, GENDER_CONFIG);

export const patientFilterConfig: FilterConfig = {
  footerIcon: IconKeys.modules.patients,
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
        icon: IconKeys.dataFields.gender,
      },
      {
        key: 'ageRange',
        type: 'ageRange',
        label: 'Age Range',
        minValue: AGE_RANGE_MIN,
        maxValue: AGE_RANGE_MAX,
      },
    ],
  },
};

/** Record filter keys that sync to URL for cross-page navigation. */
export const PATIENT_URL_FILTER_KEYS = ['patientId'] as const;

/**
 * Patient list filter configuration for FilterBar component.
 */

import type { FilterConfig } from '@/components/filters/types';
import { IconKeys } from '@/config/icons';
import { createFilterOptions } from '@/utils/filtering';
import { GENDER_VALUES, GENDER_CONFIG } from '@/types';
import { getPatientFilterPlaceholders } from '@/config/filterPlaceholders';
import { getPatientTableColumnHeaders } from '@/config/pageCopy';
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from '../constants';

const genderOptions = createFilterOptions(GENDER_VALUES, GENDER_CONFIG);

export function getPatientFilterConfig(): FilterConfig {
  const placeholders = getPatientFilterPlaceholders();
  const labels = getPatientTableColumnHeaders();

  return {
    footerIcon: IconKeys.modules.patients,
    footerLabel: labels.footerLabel,
    primaryFilters: {
      title: labels.filterTitle,
      controls: [
        {
          key: 'search',
          type: 'search',
          label: labels.searchLabel,
          placeholder: placeholders.search,
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
}

/** Record filter keys that sync to URL for cross-page navigation. */
export const PATIENT_URL_FILTER_KEYS = ['patientId'] as const;
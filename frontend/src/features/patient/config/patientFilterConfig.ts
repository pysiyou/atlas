/**
 * Patient Filter Configuration
 * Config-driven filter setup for patient list page
 */

import type { FilterConfig } from '@/utils/filters';
import { GENDER_VALUES, GENDER_CONFIG } from '@/types';
import { createFilterOptions } from '@/utils/filters';
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from '../constants';
import { ICONS } from '@/utils/icon-mappings';

/**
 * Gender filter options
 */
const genderOptions = createFilterOptions(GENDER_VALUES, GENDER_CONFIG);

/**
 * Affiliation status options
 */
const affiliationStatusOptions = [
  { id: 'active', label: 'Active', color: 'success' },
  { id: 'inactive', label: 'Inactive', color: 'default' },
];

/**
 * Patient filter configuration
 */
export const patientFilterConfig: FilterConfig = {
  quickFilters: [],
  primaryFilters: {
    title: 'Filters',
    collapsible: false,
    controls: [
      {
        type: 'search',
        key: 'searchQuery',
        label: 'Search',
        placeholder: 'Search patients by name, ID, phone, or email...',
        debounceMs: 300,
      },
      {
        type: 'ageRange',
        key: 'ageRange',
        label: 'Age Range',
        placeholder: 'Filter by age range',
        min: AGE_RANGE_MIN,
        max: AGE_RANGE_MAX,
        icon: ICONS.dataFields.date,
      },
      {
        type: 'multiSelect',
        key: 'gender',
        label: 'Sex',
        options: genderOptions,
        selectAllLabel: 'All genders',
        icon: ICONS.dataFields.userHands,
        placeholder: 'Select sex/gender',
      },
      {
        type: 'multiSelect',
        key: 'affiliationStatus',
        label: 'Affiliation Status',
        options: affiliationStatusOptions,
        selectAllLabel: 'All statuses',
        icon: ICONS.actions.infoCircle,
        placeholder: 'Select affiliation status',
      },
    ],
  },
  advancedFilters: {
    title: 'Advanced Filters',
    collapsible: true,
    defaultCollapsed: true,
    controls: [],
  },
};

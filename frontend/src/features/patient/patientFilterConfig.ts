/**
 * Patient Filter Configuration
 * Config-driven filter setup for patients page
 */

import type { FilterConfig } from '@/features/filters';
import { GENDER_VALUES, GENDER_CONFIG } from '@/types';
import { createFilterOptions } from '@/utils/filtering';
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from './constants';

/**
 * Prepare filter options for gender/sex
 */
const genderOptions = createFilterOptions(GENDER_VALUES, GENDER_CONFIG);

/**
 * Affiliation status filter options
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
        icon: 'hourglass',
      },
      {
        type: 'multiSelect',
        key: 'sex',
        label: 'Sex',
        options: genderOptions,
        selectAllLabel: 'All genders',
        icon: 'user-hands',
        placeholder: 'Select sex/gender',
      },
      {
        type: 'multiSelect',
        key: 'affiliationStatus',
        label: 'Affiliation Status',
        options: affiliationStatusOptions,
        selectAllLabel: 'All statuses',
        icon: 'info-circle',
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

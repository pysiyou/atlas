/**
 * Entry Filter Configuration
 * Same structure as Order: search, dateRange, sampleType, status.
 * Same sizing and responsiveness via FilterBar.
 */

import type { FilterConfig } from '@/features/filters';
import { createFilterOptions } from '@/utils/filtering';
import { LAB_SAMPLE_TYPE_OPTIONS } from './labFilterConstants';
import { TEST_STATUS_CONFIG } from '@/types';
import { ICONS } from '@/utils/icon-mappings';

/** Entry workflow: sample-collected, in-progress only */
const ENTRY_STATUS_VALUES = ['sample-collected', 'in-progress'] as const;
const entryStatusOptions = createFilterOptions(ENTRY_STATUS_VALUES, {
  'sample-collected': { label: TEST_STATUS_CONFIG['sample-collected'].label },
  'in-progress': { label: TEST_STATUS_CONFIG['in-progress'].label },
} as Record<(typeof ENTRY_STATUS_VALUES)[number], { label: string }>);

/**
 * Entry filter configuration
 */
export const entryFilterConfig: FilterConfig = {
  quickFilters: [],
  primaryFilters: {
    title: 'Filters',
    collapsible: false,
    controls: [
      {
        type: 'search',
        key: 'searchQuery',
        label: 'Search',
        placeholder: 'Search tests by order ID, patient, or test name...',
        debounceMs: 300,
      },
      {
        type: 'dateRange',
        key: 'dateRange',
        label: 'Date Range',
        placeholder: 'Filter by date range',
        icon: ICONS.dataFields.date,
      },
      {
        type: 'multiSelect',
        key: 'sampleType',
        label: 'Sample Type',
        options: LAB_SAMPLE_TYPE_OPTIONS,
        selectAllLabel: 'All sample types',
        icon: ICONS.dataFields.sampleCollection,
        placeholder: 'Select sample type',
      },
      {
        type: 'multiSelect',
        key: 'status',
        label: 'Status',
        options: entryStatusOptions,
        selectAllLabel: 'All statuses',
        icon: ICONS.testStatus,
        placeholder: 'Select status',
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

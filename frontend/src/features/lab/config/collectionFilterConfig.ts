/**
 * Collection Filter Configuration
 * Same structure as Order: search, dateRange, sampleType, status.
 * Same sizing and responsiveness via FilterBar.
 */

import type { FilterConfig } from '@/features/filters';
import type { FilterOption } from '@/utils/filtering';
import { LAB_SAMPLE_TYPE_OPTIONS } from './labFilterConstants';

/** Sample status for collection: pending, collected, rejected */
const COLLECTION_STATUS_OPTIONS: FilterOption[] = [
  { id: 'pending', label: 'PENDING', color: 'warning' },
  { id: 'collected', label: 'COLLECTED', color: 'success' },
  { id: 'rejected', label: 'REJECTED', color: 'error' },
];

/**
 * Collection filter configuration
 */
export const collectionFilterConfig: FilterConfig = {
  quickFilters: [],
  primaryFilters: {
    title: 'Filters',
    collapsible: false,
    controls: [
      {
        type: 'search',
        key: 'searchQuery',
        label: 'Search',
        placeholder: 'Search samples by order ID, sample ID, patient, or test...',
        debounceMs: 300,
      },
      {
        type: 'dateRange',
        key: 'dateRange',
        label: 'Date Range',
        placeholder: 'Filter by date range',
        icon: 'calendar',
      },
      {
        type: 'multiSelect',
        key: 'sampleType',
        label: 'Sample Type',
        options: LAB_SAMPLE_TYPE_OPTIONS,
        selectAllLabel: 'All sample types',
        icon: 'sample-collection',
        placeholder: 'Select sample type',
      },
      {
        type: 'multiSelect',
        key: 'status',
        label: 'Status',
        options: COLLECTION_STATUS_OPTIONS,
        selectAllLabel: 'All statuses',
        icon: 'checklist',
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

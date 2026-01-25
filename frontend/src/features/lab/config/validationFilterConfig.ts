/**
 * Validation Filter Configuration
 * Same structure as Order: search, dateRange, sampleType, status.
 * Status = Priority (routine/urgent/stat) since all are resulted.
 * Same sizing and responsiveness via FilterBar.
 */

import type { FilterConfig } from '@/features/filters';
import { createFilterOptions } from '@/utils/filtering';
import { LAB_SAMPLE_TYPE_OPTIONS } from './labFilterConstants';
import {
  PRIORITY_LEVEL_VALUES,
  PRIORITY_LEVEL_CONFIG,
  type PriorityLevel,
} from '@/types';
import { ICONS } from '@/utils/icon-mappings';

const priorityOptions = createFilterOptions(PRIORITY_LEVEL_VALUES, {
  routine: { label: PRIORITY_LEVEL_CONFIG.routine.label },
  urgent: { label: PRIORITY_LEVEL_CONFIG.urgent.label },
  stat: { label: PRIORITY_LEVEL_CONFIG.stat.label },
} as Record<PriorityLevel, { label: string }>);

/**
 * Validation filter configuration
 */
export const validationFilterConfig: FilterConfig = {
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
        options: priorityOptions,
        selectAllLabel: 'All statuses',
        icon: ICONS.priority,
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

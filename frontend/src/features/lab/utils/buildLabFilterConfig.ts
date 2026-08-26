/**
 * Factory for lab workflow filter configs — deduplicates shared search/date/sample controls.
 */

import type { FilterConfig, FilterControl } from '@/features/filters';
import { SHARED_FILTER_PLACEHOLDERS } from '@/features/filters';
import { ICONS } from '@/utils';
import { LAB_CONFIG } from '@/features/lab/config';
import { SAMPLE_TYPE_VALUES, SAMPLE_TYPE_CONFIG } from '@/types';
import type { FilterOption } from '@/utils/filtering';

const LAB_SAMPLE_TYPE_OPTIONS: FilterOption[] = SAMPLE_TYPE_VALUES.map(st => ({
  id: st,
  label: SAMPLE_TYPE_CONFIG[st].label,
  color: st,
}));

export interface BuildLabFilterConfigOptions {
  searchPlaceholder: string;
  searchHelpText: string;
  dateRangeHelpText: string;
  extraControls: FilterControl[];
}

export function buildLabFilterConfig(options: BuildLabFilterConfigOptions): FilterConfig {
  return {
    quickFilters: [],
    primaryFilters: {
      title: 'Filters',
      collapsible: false,
      controls: [
        {
          type: 'search',
          key: 'searchQuery',
          label: 'Search',
          placeholder: options.searchPlaceholder,
          debounceMs: LAB_CONFIG.SEARCH_DEBOUNCE_MS,
          helpText: options.searchHelpText,
        },
        {
          type: 'dateRange',
          key: 'dateRange',
          label: 'Date Range',
          placeholder: SHARED_FILTER_PLACEHOLDERS.dateRange,
          icon: ICONS.dataFields.date,
          helpText: options.dateRangeHelpText,
        },
        {
          type: 'multiSelect',
          key: 'sampleType',
          label: 'Sample Type',
          options: LAB_SAMPLE_TYPE_OPTIONS,
          selectAllLabel: 'All sample types',
          icon: ICONS.dataFields.sampleCollection,
          placeholder: SHARED_FILTER_PLACEHOLDERS.sampleType,
          helpText: 'Filter by specimen type (e.g. blood, urine, swab).',
        },
        ...options.extraControls,
      ],
    },
    advancedFilters: {
      title: 'Advanced Filters',
      collapsible: true,
      defaultCollapsed: true,
      controls: [],
    },
  };
}

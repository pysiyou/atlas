/**
 * Factory for lab workflow filter configs — deduplicates shared search/date/sample controls.
 */

import type { FilterConfig, FilterControlConfig } from '@/components/filters';
import { getSharedFilterPlaceholders } from '@/config/filterPlaceholders';
import { tCap } from '@/config/clientConfig';
import { IconKeys } from '@/config/icons';
import { LAB_CONFIG } from '../constants';
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
  extraControls: FilterControlConfig[];
}

export function buildLabFilterConfig(options: BuildLabFilterConfigOptions): FilterConfig {
  const sharedPlaceholders = getSharedFilterPlaceholders();
  return {
    footerIcon: IconKeys.modules.laboratory,
    footerLabel: tCap('laboratory', 'Laboratory'),
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
          placeholder: sharedPlaceholders.dateRange,
          icon: IconKeys.dataFields.date,
          helpText: options.dateRangeHelpText,
        },
        {
          type: 'multiSelect',
          key: 'sampleType',
          label: 'Sample Type',
          options: LAB_SAMPLE_TYPE_OPTIONS,
          selectAllLabel: 'All sample types',
          icon: IconKeys.dataFields.sampleCollection,
          placeholder: sharedPlaceholders.sampleType,
          helpText: 'Filter by sample type (e.g. blood, urine, swab).',
        },
        ...options.extraControls,
      ],
    },
  };
}

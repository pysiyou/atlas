/**
 * Lab workflow filter configuration for FilterBar component.
 */

import type { FilterConfig } from '@/components/filters/types';
import { MODULE_ICONS } from '@/config/icons';

/**
 * Base lab workflow filter config (collection, entry, validation).
 * Each workflow stage can extend this with stage-specific status options.
 */
export const labFilterConfigBase: Omit<FilterConfig, 'primaryFilters'> = {
  footerIcon: MODULE_ICONS.laboratory,
  footerLabel: 'Lab',
};

/**
 * Sample collection queue filter config.
 */
export const labCollectionFilterConfig: FilterConfig = {
  ...labFilterConfigBase,
  primaryFilters: {
    title: 'Collection Filters',
    controls: [
      {
        key: 'search',
        type: 'search',
        label: 'Search',
        placeholder: 'Search by order, patient, sample...',
      },
    ],
  },
  advancedFilters: {
    title: 'Advanced Filters',
    controls: [
      {
        key: 'dateRange',
        type: 'dateRange',
        label: 'Order Date Range',
      },
    ],
  },
};

/**
 * Result entry queue filter config.
 */
export const labEntryFilterConfig: FilterConfig = {
  ...labFilterConfigBase,
  primaryFilters: {
    title: 'Entry Filters',
    controls: [
      {
        key: 'search',
        type: 'search',
        label: 'Search',
        placeholder: 'Search by order, patient, sample...',
      },
    ],
  },
  advancedFilters: {
    title: 'Advanced Filters',
    controls: [
      {
        key: 'dateRange',
        type: 'dateRange',
        label: 'Order Date Range',
      },
    ],
  },
};

/**
 * Result validation queue filter config.
 */
export const labValidationFilterConfig: FilterConfig = {
  ...labFilterConfigBase,
  primaryFilters: {
    title: 'Validation Filters',
    controls: [
      {
        key: 'search',
        type: 'search',
        label: 'Search',
        placeholder: 'Search by order, patient, sample...',
      },
    ],
  },
  advancedFilters: {
    title: 'Advanced Filters',
    controls: [
      {
        key: 'dateRange',
        type: 'dateRange',
        label: 'Order Date Range',
      },
    ],
  },
};

/** Entity filter keys that sync to URL for cross-page navigation. */
export const LAB_URL_FILTER_KEYS = ['sampleId', 'orderId', 'testId'] as const;

/**
 * Catalog Filter Configuration
 * Config-driven filter setup for catalog page
 */

import type { FilterConfig } from '@/components/filters';
import { SHARED_FILTER_PLACEHOLDERS } from '@/config/filterPlaceholders';
import type { TestCategory } from '@/types';
import { SAMPLE_TYPE_VALUES, SAMPLE_TYPE_CONFIG } from '@/types';
import { PRICE_RANGE } from '@/utils/constants';
import { ICONS, MODULE_ICONS } from '@/config/icons';

import {
  TEST_CATEGORY_CONFIG as GENERATED_TEST_CATEGORY_CONFIG,
  TEST_CATEGORY_VALUES as GENERATED_TEST_CATEGORY_VALUES,
  getGeneratedCategoryLabel,
} from '@/types/generated/catalogCategories';

export const TEST_CATEGORY_CONFIG: Record<string, { label: string; color: string }> =
  GENERATED_TEST_CATEGORY_CONFIG;

/** Human-readable label for a test category slug. */
export function getCategoryLabel(category: string): string {
  return getGeneratedCategoryLabel(category);
}

const TEST_CATEGORY_VALUES = [...GENERATED_TEST_CATEGORY_VALUES] as TestCategory[];

/**
 * Transform category values into filter option format
 */
const categoryFilterOptions = TEST_CATEGORY_VALUES.map(category => ({
  id: category,
  label: TEST_CATEGORY_CONFIG[category]?.label || category,
  color: TEST_CATEGORY_CONFIG[category]?.color,
}));

const sampleTypeFilterOptions = SAMPLE_TYPE_VALUES.map(sampleType => ({
  id: sampleType,
  label: SAMPLE_TYPE_CONFIG[sampleType].label,
  color: sampleType,
}));

/**
 * Catalog filter configuration
 */
export const catalogFilterConfig: FilterConfig = {
  footerIcon: MODULE_ICONS.catalog,
  footerLabel: 'Catalog',
  quickFilters: [],
  primaryFilters: {
    title: 'Filters',
    collapsible: false,
    controls: [
      {
        type: 'search',
        key: 'search',
        label: 'Search',
        placeholder: 'Search tests by name, code, or synonym...',
        debounceMs: 300,
        helpText: 'Search tests by name, code, or synonym.',
      },
      {
        type: 'multiSelect',
        key: 'category',
        label: 'Test Category',
        options: categoryFilterOptions,
        selectAllLabel: 'All categories',
        icon: ICONS.ui.category,
        placeholder: SHARED_FILTER_PLACEHOLDERS.testCategory,
        helpText: 'Filter by test category (e.g. Hematology, Biochemistry).',
      },
      {
        type: 'multiSelect',
        key: 'sampleType',
        label: 'Sample Type',
        options: sampleTypeFilterOptions,
        selectAllLabel: 'All sample types',
        icon: ICONS.dataFields.sampleCollection,
        placeholder: SHARED_FILTER_PLACEHOLDERS.sampleType,
        helpText: 'Filter by required sample type for the test.',
      },
      {
        type: 'priceRange',
        key: 'priceRange',
        label: 'Price Range',
        placeholder: SHARED_FILTER_PLACEHOLDERS.priceRange,
        minValue: PRICE_RANGE.MIN,
        maxValue: PRICE_RANGE.MAX,
        currencySymbol: '',
        icon: ICONS.dataFields.wallet,
        helpText: 'Filter tests by price range (min–max).',
      },
    ],
  },
};

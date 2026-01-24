/**
 * Catalog Filter Configuration
 * Config-driven filter setup for catalog page
 */

import type { FilterConfig } from '@/features/filters';
import type { TestCategory } from '@/types';
import { PRICE_RANGE } from '@/shared/constants';

/**
 * Test category configuration for filter display
 */
const TEST_CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  hematology: { label: 'Hematology', color: 'hematology' },
  biochemistry: { label: 'Biochemistry', color: 'biochemistry' },
  chemistry: { label: 'Chemistry', color: 'chemistry' },
  microbiology: { label: 'Microbiology', color: 'microbiology' },
  serology: { label: 'Serology', color: 'serology' },
  urinalysis: { label: 'Urinalysis', color: 'urinalysis' },
  imaging: { label: 'Imaging', color: 'imaging' },
  immunology: { label: 'Immunology', color: 'immunology' },
  molecular: { label: 'Molecular', color: 'molecular' },
  toxicology: { label: 'Toxicology', color: 'toxicology' },
  coagulation: { label: 'Coagulation', color: 'coagulation' },
};

/**
 * Available test category values for filtering
 */
const TEST_CATEGORY_VALUES: TestCategory[] = [
  'hematology',
  'biochemistry',
  'microbiology',
  'serology',
  'urinalysis',
  'immunology',
  'molecular',
  'toxicology',
  'coagulation',
];

/**
 * Transform category values into filter option format
 */
const categoryFilterOptions = TEST_CATEGORY_VALUES.map(category => ({
  id: category,
  label: TEST_CATEGORY_CONFIG[category]?.label || category,
  color: TEST_CATEGORY_CONFIG[category]?.color,
}));

/**
 * Sample type configuration for filter display
 */
const SAMPLE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  blood: { label: 'Blood', color: 'blood' },
  plasma: { label: 'Plasma', color: 'plasma' },
  serum: { label: 'Serum', color: 'serum' },
  urine: { label: 'Urine', color: 'urine' },
  stool: { label: 'Stool', color: 'stool' },
  swab: { label: 'Swab', color: 'swab' },
  tissue: { label: 'Tissue', color: 'tissue' },
  csf: { label: 'CSF (Cerebrospinal Fluid)', color: 'csf' },
  sputum: { label: 'Sputum', color: 'sputum' },
  fluid: { label: 'Body Fluid', color: 'fluid' },
  other: { label: 'Other', color: 'other' },
};

/**
 * Available sample type values for filtering
 */
const SAMPLE_TYPE_VALUES = [
  'blood',
  'plasma',
  'serum',
  'urine',
  'stool',
  'swab',
  'tissue',
  'csf',
  'sputum',
  'fluid',
  'other',
];

/**
 * Transform sample type values into filter option format
 */
const sampleTypeFilterOptions = SAMPLE_TYPE_VALUES.map(sampleType => ({
  id: sampleType,
  label: SAMPLE_TYPE_CONFIG[sampleType]?.label || sampleType,
  color: SAMPLE_TYPE_CONFIG[sampleType]?.color,
}));

/**
 * Catalog filter configuration
 */
export const catalogFilterConfig: FilterConfig = {
  quickFilters: [],
  primaryFilters: {
    title: 'Filters',
    collapsible: false,
    controls: [
      {
        type: 'search',
        key: 'searchQuery',
        label: 'Search',
        placeholder: 'Search tests by name, code, or synonym...',
        debounceMs: 300,
      },
      {
        type: 'multiSelect',
        key: 'category',
        label: 'Test Category',
        options: categoryFilterOptions,
        selectAllLabel: 'All categories',
        icon: 'category',
        placeholder: 'Select test categories',
      },
      {
        type: 'multiSelect',
        key: 'sampleType',
        label: 'Sample Type',
        options: sampleTypeFilterOptions,
        selectAllLabel: 'All sample types',
        icon: 'sample-collection',
        placeholder: 'Select sample types',
      },
      {
        type: 'priceRange',
        key: 'priceRange',
        label: 'Price Range',
        placeholder: 'Filter by price range',
        min: PRICE_RANGE.MIN,
        max: PRICE_RANGE.MAX,
        currency: '',
        icon: 'wallet',
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

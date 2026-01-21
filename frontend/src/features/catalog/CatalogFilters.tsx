/**
 * CatalogFilters Component
 * Filter controls for the test catalog list
 */

import React from 'react';
import { SearchBar, MultiSelectFilter } from '@/shared/ui';
import type { TestCategory } from '@/types';

/**
 * Test category configuration for filter display
 */
const TEST_CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  hematology: { label: 'Hematology', color: 'pink' },
  biochemistry: { label: 'Biochemistry', color: 'blue' },
  chemistry: { label: 'Chemistry', color: 'blue' },
  microbiology: { label: 'Microbiology', color: 'emerald' },
  serology: { label: 'Serology', color: 'purple' },
  urinalysis: { label: 'Urinalysis', color: 'yellow' },
  imaging: { label: 'Imaging', color: 'gray' },
  immunology: { label: 'Immunology', color: 'indigo' },
  molecular: { label: 'Molecular', color: 'cyan' },
  toxicology: { label: 'Toxicology', color: 'red' },
  coagulation: { label: 'Coagulation', color: 'rose' },
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
 * Create filter options from category values
 */
const categoryFilterOptions = TEST_CATEGORY_VALUES.map((category) => ({
  id: category,
  label: TEST_CATEGORY_CONFIG[category]?.label || category,
}));

/**
 * Sample type configuration for filter display
 */
const SAMPLE_TYPE_CONFIG: Record<string, { label: string }> = {
  blood: { label: 'Blood' },
  plasma: { label: 'Plasma' },
  serum: { label: 'Serum' },
  urine: { label: 'Urine' },
  stool: { label: 'Stool' },
  swab: { label: 'Swab' },
  tissue: { label: 'Tissue' },
  csf: { label: 'CSF' },
  sputum: { label: 'Sputum' },
  fluid: { label: 'Fluid' },
  other: { label: 'Other' },
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
 * Create filter options from sample type values
 */
const sampleTypeFilterOptions = SAMPLE_TYPE_VALUES.map((sampleType) => ({
  id: sampleType,
  label: SAMPLE_TYPE_CONFIG[sampleType]?.label || sampleType,
}));

/**
 * Props for CatalogFilters component
 */
interface CatalogFiltersProps {
  /** Current search query */
  searchQuery: string;
  /** Handler for search query changes */
  onSearchChange: (value: string) => void;
  /** Currently selected category filters */
  categoryFilters: TestCategory[];
  /** Handler for category filter changes */
  onCategoryFiltersChange: (values: TestCategory[]) => void;
  /** Currently selected sample type filters */
  sampleTypeFilters: string[];
  /** Handler for sample type filter changes */
  onSampleTypeFiltersChange: (values: string[]) => void;
}

/**
 * CatalogFilters Component
 * Provides search and filter controls for the test catalog
 */
export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  searchQuery,
  onSearchChange,
  categoryFilters,
  onCategoryFiltersChange,
  sampleTypeFilters,
  onSampleTypeFiltersChange,
}) => {
  return (
    <div className="p-4 border-b border-gray-200 shrink-0 bg-gray-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left side: Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <MultiSelectFilter
            label="Category"
            options={categoryFilterOptions}
            selectedIds={categoryFilters}
            onChange={(ids) => onCategoryFiltersChange(ids as TestCategory[])}
            selectAllLabel="Select all"
            icon="flask"
            placeholder="Filter by Category"
          />

          <div className="h-6 w-px bg-gray-300 hidden md:block" />

          {/* Sample Type Filter */}
          <MultiSelectFilter
            label="Sample Type"
            options={sampleTypeFilterOptions}
            selectedIds={sampleTypeFilters}
            onChange={(ids) => onSampleTypeFiltersChange(ids as string[])}
            selectAllLabel="Select all"
            icon="lab-tube"
            placeholder="Filter by Sample"
          />
        </div>

        {/* Right side: Search */}
        <div className="w-full md:w-72">
          <SearchBar
            placeholder="Search tests by name, code, or synonym..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * CatalogFilters Component
 * 
 * Provides comprehensive filtering controls for the test catalog using the new filter architecture.
 * Uses config-driven approach with FilterBar component.
 * 
 * @module features/catalog
 */

import React, { useMemo } from 'react';
import { FilterBar, type FilterValues } from '@/features/filters';
import { catalogFilterConfig } from './catalogFilterConfig';
import type { TestCategory } from '@/types';

/**
 * Props interface for CatalogFilters component
 */
export interface CatalogFiltersProps {
  /** Current search query string */
  searchQuery: string;
  /** Callback fired when search query changes */
  onSearchChange: (value: string) => void;
  /** Array of currently selected test categories */
  categoryFilters: TestCategory[];
  /** Callback fired when category filters change */
  onCategoryFiltersChange: (values: TestCategory[]) => void;
  /** Array of currently selected sample types */
  sampleTypeFilters: string[];
  /** Callback fired when sample type filters change */
  onSampleTypeFiltersChange: (values: string[]) => void;
  /** Currently selected price range [min, max] */
  priceRange: [number, number];
  /** Callback fired when price range changes */
  onPriceRangeChange: (range: [number, number]) => void;
}

/**
 * CatalogFilters Component
 * 
 * Composes FilterBar with catalog-specific configuration.
 * Maps between legacy prop interface and new filter value structure.
 * 
 * @component
 */
export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  searchQuery,
  onSearchChange,
  categoryFilters,
  onCategoryFiltersChange,
  sampleTypeFilters,
  onSampleTypeFiltersChange,
  priceRange,
  onPriceRangeChange,
}) => {
  /**
   * Convert props to filter values format
   */
  const filterValues = useMemo<FilterValues>(
    () => ({
      searchQuery,
      category: categoryFilters,
      sampleType: sampleTypeFilters,
      priceRange,
    }),
    [searchQuery, categoryFilters, sampleTypeFilters, priceRange]
  );

  /**
   * Handle filter changes and map back to props
   */
  const handleFilterChange = (filters: FilterValues) => {
    if (filters.searchQuery !== undefined) {
      onSearchChange(filters.searchQuery as string);
    }
    if (filters.category !== undefined) {
      onCategoryFiltersChange(filters.category as TestCategory[]);
    }
    if (filters.sampleType !== undefined) {
      onSampleTypeFiltersChange(filters.sampleType as string[]);
    }
    if (filters.priceRange !== undefined) {
      onPriceRangeChange(filters.priceRange as [number, number]);
    }
  };

  return (
    <FilterBar
      config={catalogFilterConfig}
      value={filterValues}
      onChange={handleFilterChange}
    />
  );
};

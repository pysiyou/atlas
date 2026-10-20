/**
 * CatalogFilters Component
 *
 * Provides comprehensive filtering controls for the test catalog using the new filter architecture.
 * Uses config-driven approach with FilterBar component.
 *
 * @module features/catalog
 */

import React, { useMemo } from 'react';
import { FilterBar, useFilterBarBridge } from '@/components/filters';
import { catalogFilterConfig } from '../constants/catalogConfig';
import type { TestCategory } from '@/types';

export interface CatalogFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilters: TestCategory[];
  onCategoryFiltersChange: (values: TestCategory[]) => void;
  sampleTypeFilters: string[];
  onSampleTypeFiltersChange: (values: string[]) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
}

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
  const value = useMemo(
    () => ({
      search: searchQuery,
      category: categoryFilters,
      sampleType: sampleTypeFilters,
      priceRange,
    }),
    [searchQuery, categoryFilters, sampleTypeFilters, priceRange]
  );

  const { filterValues, handleFilterChange } = useFilterBarBridge(value, {
    search: onSearchChange,
    category: onCategoryFiltersChange,
    sampleType: onSampleTypeFiltersChange,
    priceRange: onPriceRangeChange,
  });

  return (
    <FilterBar config={catalogFilterConfig} value={filterValues} onChange={handleFilterChange} />
  );
};

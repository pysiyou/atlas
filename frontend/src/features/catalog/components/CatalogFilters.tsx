/**
 * CatalogFilters — FilterBar for the test catalog list.
 */

import React, { useMemo } from 'react';
import type { FilterValues } from '@/components/filters/types';
import { FilterBar } from '@/components/filters';
import { useFilterBarBridge } from '@/hooks/filters';
import { catalogFilterConfig } from '../constants/catalogConfig';
import type { TestCategory } from '@/types';

export interface CatalogFiltersProps {
  filters: FilterValues;
  setFilter: (key: string, value: unknown) => void;
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({ filters, setFilter }) => {
  const value = useMemo(
    () => ({
      search: (filters.search as string) ?? '',
      category: (filters.category as TestCategory[]) ?? [],
      sampleType: (filters.sampleType as string[]) ?? [],
      priceRange: filters.priceRange as [number, number],
    }),
    [filters],
  );

  const { filterValues, handleFilterChange } = useFilterBarBridge(value, {
    search: v => setFilter('search', v),
    category: v => setFilter('category', v),
    sampleType: v => setFilter('sampleType', v),
    priceRange: v => setFilter('priceRange', v),
  });

  return (
    <FilterBar config={catalogFilterConfig} value={filterValues} onChange={handleFilterChange} />
  );
};

/**
 * useCatalogFilters Hook
 * 
 * Manages catalog filter state and filtering logic
 */

import { useState, useMemo } from 'react';
import type { Test, TestCategory } from '@/types';
import { PRICE_RANGE } from '@/shared/constants';

interface UseCatalogFiltersOptions {
  tests: Test[];
}

/**
 * Hook for managing catalog filters
 */
export function useCatalogFilters({ tests }: UseCatalogFiltersOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilters, setCategoryFilters] = useState<TestCategory[]>([]);
  const [sampleTypeFilters, setSampleTypeFilters] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    PRICE_RANGE.MIN,
    PRICE_RANGE.MAX,
  ]);

  // Apply filters with search, category, sample type, and price range
  const filteredTests = useMemo(() => {
    let filtered = tests;

    // Search filter (name, code, synonyms, LOINC, panels)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(test => {
        return (
          test.name.toLowerCase().includes(query) ||
          test.code.toLowerCase().includes(query) ||
          test.synonyms?.some(syn => syn.toLowerCase().includes(query)) ||
          test.loincCodes?.some(loinc => loinc.toLowerCase().includes(query)) ||
          test.panels?.some(panel => panel.toLowerCase().includes(query))
        );
      });
    }

    // Category filter
    if (categoryFilters.length > 0) {
      filtered = filtered.filter(test => categoryFilters.includes(test.category));
    }

    // Sample type filter
    if (sampleTypeFilters.length > 0) {
      filtered = filtered.filter(test => sampleTypeFilters.includes(test.sampleType));
    }

    // Price range filter
    const [minPrice, maxPrice] = priceRange;
    if (minPrice !== PRICE_RANGE.MIN || maxPrice !== PRICE_RANGE.MAX) {
      filtered = filtered.filter(test => test.price >= minPrice && test.price <= maxPrice);
    }

    // Sort by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [tests, searchQuery, categoryFilters, sampleTypeFilters, priceRange]);

  return {
    // Filtered results
    filteredTests,
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Category filters
    categoryFilters,
    setCategoryFilters,
    
    // Sample type filters
    sampleTypeFilters,
    setSampleTypeFilters,
    
    // Price range
    priceRange,
    setPriceRange,
  };
}

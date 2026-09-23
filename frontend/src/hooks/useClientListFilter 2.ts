/**
 * Filtering Hooks
 * React hooks for filtering, searching, and sorting lists.
 * Pure filter functions and types live in @/utils/filtering.
 */

import { useState, useMemo, useCallback } from 'react';
import type {
  SortDirection,
  SortConfig,
  UseClientListFilterOptions,
  UseClientListFilterReturn,
} from '@/utils/filtering';

export function useClientListFilter<T, S extends string = string>(
  items: T[],
  options: UseClientListFilterOptions<T, S> = {}
): UseClientListFilterReturn<T, S> {
  const { searchFields, defaultSort, statusField, initialStatusFilters = [] } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<S[]>(initialStatusFilters);
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(defaultSort || null);

  const toggleStatusFilter = useCallback((status: S) => {
    setStatusFilters(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  }, []);

  const setSort = useCallback((field: keyof T, direction: SortDirection = 'asc') => {
    setSortConfig({ field, direction });
  }, []);

  const toggleSort = useCallback((field: keyof T) => {
    setSortConfig(prev => {
      if (prev?.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { field, direction: 'asc' };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilters(initialStatusFilters);
    setSortConfig(defaultSort || null);
  }, [initialStatusFilters, defaultSort]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (searchQuery.trim() && searchFields) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item =>
        searchFields(item).some(field => field.toLowerCase().includes(lowerQuery))
      );
    }

    if (statusFilters.length > 0 && statusField) {
      result = result.filter(item => statusFilters.includes(item[statusField] as unknown as S));
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.field];
        const bVal = b[sortConfig.field];
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;
        return sortConfig.direction === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [items, searchQuery, searchFields, statusFilters, statusField, sortConfig]);

  return {
    filteredItems,
    searchQuery,
    setSearchQuery,
    statusFilters,
    setStatusFilters,
    toggleStatusFilter,
    sortConfig,
    setSort,
    toggleSort,
    isEmpty: filteredItems.length === 0,
    hasActiveSearch: searchQuery.trim().length > 0,
    clearFilters,
  };
}

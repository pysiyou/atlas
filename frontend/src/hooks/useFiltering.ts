/**
 * Generic Filtering Hook
 * Provides reusable filtering, searching, and sorting functionality
 */

import { useState, useMemo, useCallback } from 'react';

type SortDirection = 'asc' | 'desc';

interface SortConfig<T> {
  field: keyof T;
  direction: SortDirection;
}

interface UseFilteringOptions<T, S extends string = string> {
  /** Function to get searchable string fields from an item */
  searchFields?: (item: T) => string[];
  /** Default sort configuration */
  defaultSort?: SortConfig<T>;
  /** Available status values for filtering */
  statusField?: keyof T;
  /** Initial status filters */
  initialStatusFilters?: S[];
}

interface UseFilteringReturn<T, S extends string = string> {
  /** Filtered and sorted items */
  filteredItems: T[];
  /** Current search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Current status filters */
  statusFilters: S[];
  /** Set status filters */
  setStatusFilters: (filters: S[]) => void;
  /** Toggle a status filter */
  toggleStatusFilter: (status: S) => void;
  /** Current sort configuration */
  sortConfig: SortConfig<T> | null;
  /** Set sort field and direction */
  setSort: (field: keyof T, direction?: SortDirection) => void;
  /** Toggle sort direction for a field */
  toggleSort: (field: keyof T) => void;
  /** Whether the filtered result is empty */
  isEmpty: boolean;
  /** Whether search is active */
  hasActiveSearch: boolean;
  /** Clear all filters */
  clearFilters: () => void;
}

/**
 * Generic hook for filtering, searching, and sorting lists
 */
export function useFiltering<T, S extends string = string>(
  items: T[],
  options: UseFilteringOptions<T, S> = {}
): UseFilteringReturn<T, S> {
  const { searchFields, defaultSort, statusField, initialStatusFilters = [] } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<S[]>(initialStatusFilters);
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(defaultSort || null);

  const toggleStatusFilter = useCallback((status: S) => {
    setStatusFilters(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
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

    // Apply search filter
    if (searchQuery.trim() && searchFields) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => {
        const fields = searchFields(item);
        return fields.some(field => field.toLowerCase().includes(lowerQuery));
      });
    }

    // Apply status filter
    if (statusFilters.length > 0 && statusField) {
      result = result.filter(item => {
        const status = item[statusField] as unknown as S;
        return statusFilters.includes(status);
      });
    }

    // Apply sorting
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

/**
 * Simpler search-only filtering hook
 * For cases where you just need search functionality
 */
export function useSearch<T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean
) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    return items.filter(item => searchFn(item, searchQuery));
  }, [items, searchQuery, searchFn]);

  return {
    filteredItems,
    searchQuery,
    setSearchQuery,
    isEmpty: filteredItems.length === 0,
  };
}

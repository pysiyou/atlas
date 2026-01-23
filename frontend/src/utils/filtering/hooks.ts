/**
 * Filtering Hooks
 * React hooks for filtering, searching, and sorting
 */

import { useState, useMemo, useCallback } from 'react';
import type { SortDirection, SortConfig, UseFilteringOptions, UseFilteringReturn } from './types';

/**
 * Generic hook for filtering, searching, and sorting lists
 *
 * @example
 * ```typescript
 * const {
 *   filteredItems,
 *   searchQuery,
 *   setSearchQuery,
 *   statusFilters,
 *   setStatusFilters,
 * } = useFiltering<Patient, Gender>(patients, {
 *   searchFields: (p) => [p.name, p.email],
 *   statusField: 'gender',
 *   defaultSort: { field: 'name', direction: 'asc' },
 * });
 * ```
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
 *
 * @example
 * ```typescript
 * const { filteredItems, searchQuery, setSearchQuery } = useSearch(
 *   items,
 *   (item, query) => item.name.toLowerCase().includes(query.toLowerCase())
 * );
 * ```
 */
export function useSearch<T>(items: T[], searchFn: (item: T, query: string) => boolean) {
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

/**
 * Hook for managing multi-select filter state
 *
 * @example
 * ```typescript
 * const { selected, toggle, clear, isSelected } = useMultiSelect<OrderStatus>(['pending']);
 * ```
 */
export function useMultiSelect<T extends string>(initialValues: T[] = []) {
  const [selected, setSelected] = useState<T[]>(initialValues);

  const toggle = useCallback((value: T) => {
    setSelected(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]));
  }, []);

  const clear = useCallback(() => {
    setSelected([]);
  }, []);

  const isSelected = useCallback(
    (value: T) => {
      return selected.includes(value);
    },
    [selected]
  );

  const selectAll = useCallback((values: T[]) => {
    setSelected(values);
  }, []);

  return {
    selected,
    setSelected,
    toggle,
    clear,
    isSelected,
    selectAll,
    hasSelection: selected.length > 0,
  };
}

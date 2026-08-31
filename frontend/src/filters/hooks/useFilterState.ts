/**
 * useFilterState Hook
 * Centralized filter state management
 */

import { useState, useCallback, useMemo } from 'react';
import type { FilterValues } from '../types';
import { getDefaultFilterValue, isFilterValueActive } from '../utils/filterValueHelpers';

/**
 * Options for useFilterState hook
 */
export interface UseFilterStateOptions {
  /** Initial filter values */
  initialFilters?: FilterValues;
  /** Callback when filters change */
  onChange?: (filters: FilterValues) => void;
}

/**
 * Return type for useFilterState hook
 */
export interface UseFilterStateReturn {
  /** Current filter values */
  filters: FilterValues;
  /** Update a single filter */
  setFilter: (key: string, value: unknown) => void;
  /** Clear a single filter */
  clearFilter: (key: string) => void;
  /** Clear all filters */
  clearAll: () => void;
  /** Number of active filters */
  activeCount: number;
  /** Check if any filter is active */
  isActive: boolean;
  /** Check if a specific filter is active */
  isFilterActive: (key: string) => boolean;
}

/**
 * Hook for managing filter state
 *
 * @param options - Configuration options
 * @returns Filter state and control functions
 *
 * @example
 * ```typescript
 * const {
 *   filters,
 *   setFilter,
 *   clearFilter,
 *   clearAll,
 *   activeCount,
 *   isActive,
 * } = useFilterState({
 *   initialFilters: { searchQuery: '', status: [] },
 *   onChange: (filters) => logger.debug('Filters changed', { filters }),
 * });
 * ```
 */
export function useFilterState(options: UseFilterStateOptions = {}): UseFilterStateReturn {
  const { initialFilters = {}, onChange } = options;

  const [filters, setFilters] = useState<FilterValues>(initialFilters);

  /**
   * Update a single filter value.
   * onChange is deferred to avoid updating parent (e.g. CollectionView) during FilterBar's setState.
   */
  const setFilter = useCallback(
    (key: string, value: unknown) => {
      setFilters(prev => {
        const updated = { ...prev, [key]: value };
        queueMicrotask(() => onChange?.(updated));
        return updated;
      });
    },
    [onChange]
  );

  /**
   * Clear a single filter (set to default empty value based on type)
   */
  const clearFilter = useCallback(
    (key: string) => {
      setFilters(prev => {
        const updated = { ...prev };
        updated[key] = getDefaultFilterValue(key, prev[key]);
        queueMicrotask(() => onChange?.(updated));
        return updated;
      });
    },
    [onChange]
  );

  /**
   * Clear all filters
   */
  const clearAll = useCallback(() => {
    const cleared: FilterValues = {};
    Object.keys(filters).forEach(key => {
      cleared[key] = getDefaultFilterValue(key, filters[key]);
    });
    setFilters(cleared);
    queueMicrotask(() => onChange?.(cleared));
  }, [filters, onChange]);

  /**
   * Count active filters
   */
  const activeCount = useMemo(
    () => Object.entries(filters).filter(([key, value]) => isFilterValueActive(key, value)).length,
    [filters]
  );

  /**
   * Check if any filter is active
   */
  const isActive = useMemo(() => activeCount > 0, [activeCount]);

  /**
   * Check if a specific filter is active
   */
  const isFilterActive = useCallback(
    (key: string) => isFilterValueActive(key, filters[key]),
    [filters]
  );

  return {
    filters,
    setFilter,
    clearFilter,
    clearAll,
    activeCount,
    isActive,
    isFilterActive,
  };
}

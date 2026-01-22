/**
 * useFilterState Hook
 * Centralized filter state management
 */

import { useState, useCallback, useMemo } from 'react';
import type { FilterValues } from '../types';

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
export function useFilterState(
  options: UseFilterStateOptions = {}
): UseFilterStateReturn {
  const { initialFilters = {}, onChange } = options;

  const [filters, setFilters] = useState<FilterValues>(initialFilters);

  /**
   * Update a single filter value
   */
  const setFilter = useCallback(
    (key: string, value: unknown) => {
      setFilters((prev) => {
        const updated = { ...prev, [key]: value };
        onChange?.(updated);
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
      setFilters((prev) => {
        const updated = { ...prev };
        const currentValue = updated[key];
        
        // Determine default value based on current value type
        // Check for date range first (array with 2 Date objects)
        if (
          Array.isArray(currentValue) &&
          currentValue.length === 2 &&
          currentValue[0] instanceof Date &&
          currentValue[1] instanceof Date
        ) {
          updated[key] = null;
        }
        // Check for age range or price range (array with 2 numbers)
        else if (
          Array.isArray(currentValue) &&
          currentValue.length === 2 &&
          typeof currentValue[0] === 'number' &&
          typeof currentValue[1] === 'number'
        ) {
          // Check if it's a price range by key name or value range
          if (key === 'priceRange' || (currentValue[1] > 1000 && currentValue[1] <= 100000)) {
            updated[key] = [0, 10000]; // Default price range
          } else {
            updated[key] = [0, 150]; // Default age range
          }
        }
        // Other arrays (multi-select filters)
        else if (Array.isArray(currentValue)) {
          updated[key] = [];
        }
        // Single Date
        else if (currentValue instanceof Date) {
          updated[key] = null;
        }
        // String
        else if (typeof currentValue === 'string') {
          updated[key] = '';
        }
        // Number
        else if (typeof currentValue === 'number') {
          updated[key] = null;
        }
        // Everything else
        else {
          updated[key] = null;
        }
        
        onChange?.(updated);
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
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      // Check for date range (array with 2 Date objects)
      if (
        Array.isArray(value) &&
        value.length === 2 &&
        value[0] instanceof Date &&
        value[1] instanceof Date
      ) {
        cleared[key] = null;
      }
      // Check for age range or price range (array with 2 numbers) - reset to default
      else if (
        Array.isArray(value) &&
        value.length === 2 &&
        typeof value[0] === 'number' &&
        typeof value[1] === 'number'
      ) {
        // Check if it's a price range by key name or value range
        if (key === 'priceRange' || (value[1] > 1000 && value[1] <= 100000)) {
          cleared[key] = [0, 10000]; // Default price range
        } else {
          cleared[key] = [0, 150]; // Default age range
        }
      }
      // Other arrays (multi-select filters)
      else if (Array.isArray(value)) {
        cleared[key] = [];
      }
      // String
      else if (typeof value === 'string') {
        cleared[key] = '';
      }
      // Everything else (Date, number, null, etc.)
      else {
        cleared[key] = null;
      }
    });
    setFilters(cleared);
    onChange?.(cleared);
  }, [filters, onChange]);

  /**
   * Count active filters
   */
  const activeCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (value instanceof Date) return true;
      if (Array.isArray(value) && value.length === 2) {
        // Date range or age range
        if (value[0] instanceof Date && value[1] instanceof Date) return true;
        if (typeof value[0] === 'number' && typeof value[1] === 'number') {
          // Age range or price range - check if not default
          // Check if it's a price range by key name
          const isPriceRange = key === 'priceRange' || (value[1] > 1000 && value[1] <= 100000);
          if (isPriceRange) {
            return !(value[0] === 0 && value[1] === 10000);
          } else {
            return !(value[0] === 0 && value[1] === 150);
          }
        }
      }
      return true;
    }).length;
  }, [filters]);

  /**
   * Check if any filter is active
   */
  const isActive = useMemo(() => activeCount > 0, [activeCount]);

  /**
   * Check if a specific filter is active
   */
  const isFilterActive = useCallback(
    (key: string) => {
      const value = filters[key];
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (value instanceof Date) return true;
      if (Array.isArray(value) && value.length === 2) {
        if (value[0] instanceof Date && value[1] instanceof Date) return true;
        if (typeof value[0] === 'number' && typeof value[1] === 'number') {
          // Check if it's a price range by key name or value range
          const isPriceRange = key === 'priceRange' || (value[1] > 1000 && value[1] <= 100000);
          if (isPriceRange) {
            return !(value[0] === 0 && value[1] === 10000);
          } else {
            return !(value[0] === 0 && value[1] === 150);
          }
        }
      }
      return true;
    },
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

/**
 * useFilterPersistence Hook
 * Persist filter state to URL query params only (localStorage removed)
 */

import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FilterValues } from '../types';

/**
 * Options for useFilterPersistence hook
 */
export interface UseFilterPersistenceOptions {
  /** Whether to persist to URL query params */
  useUrlParams?: boolean;
  /** Filter values to sync */
  filters: FilterValues;
  /** Callback when filters are restored */
  onRestore?: (filters: FilterValues) => void;
}

/**
 * Hook for persisting filter state to URL query params
 *
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * useFilterPersistence({
 *   useUrlParams: true,
 *   filters: currentFilters,
 *   onRestore: (filters) => setFilters(filters),
 * });
 * ```
 */
export function useFilterPersistence(options: UseFilterPersistenceOptions): void {
  const { useUrlParams = true, filters, onRestore } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Serialize filters to URL-safe format
   */
  const serializeFilters = useCallback((f: FilterValues): Record<string, string> => {
    const params: Record<string, string> = {};

    Object.entries(f).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      if (typeof value === 'string' && value.trim()) {
        params[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        params[key] = value.join(',');
      } else if (value instanceof Date) {
        params[key] = value.toISOString();
      } else if (Array.isArray(value) && value.length === 2) {
        // Date range or age range
        if (value[0] instanceof Date && value[1] instanceof Date) {
          params[`${key}_start`] = value[0].toISOString();
          params[`${key}_end`] = value[1].toISOString();
        } else if (typeof value[0] === 'number' && typeof value[1] === 'number') {
          params[`${key}_min`] = value[0].toString();
          params[`${key}_max`] = value[1].toString();
        }
      }
    });

    return params;
  }, []);

  /**
   * Deserialize filters from URL params
   */
  const deserializeFilters = useCallback((): FilterValues => {
    const restored: FilterValues = {};

    // Get all filter-related params
    const filterKeys = new Set<string>();
    searchParams.forEach((_, key) => {
      const baseKey = key.replace(/_start$|_end$|_min$|_max$/, '');
      filterKeys.add(baseKey);
    });

    filterKeys.forEach(key => {
      const startParam = searchParams.get(`${key}_start`);
      const endParam = searchParams.get(`${key}_end`);
      const minParam = searchParams.get(`${key}_min`);
      const maxParam = searchParams.get(`${key}_max`);
      const singleParam = searchParams.get(key);

      if (startParam && endParam) {
        // Date range
        restored[key] = [new Date(startParam), new Date(endParam)];
      } else if (minParam && maxParam) {
        // Age range
        restored[key] = [Number(minParam), Number(maxParam)];
      } else if (singleParam) {
        // String or array
        if (singleParam.includes(',')) {
          restored[key] = singleParam.split(',');
        } else {
          restored[key] = singleParam;
        }
      }
    });

    return restored;
  }, [searchParams]);

  /**
   * Sync filters to URL params
   */
  useEffect(() => {
    if (!useUrlParams) return;

    const params = serializeFilters(filters);
    const currentParams = new URLSearchParams(searchParams);

    // Remove old filter params
    const keysToRemove: string[] = [];
    currentParams.forEach((_, key) => {
      if (
        key.includes('_start') ||
        key.includes('_end') ||
        key.includes('_min') ||
        key.includes('_max')
      ) {
        keysToRemove.push(key);
      } else {
        // Check if it's a filter key that no longer exists
        if (!(key in params) && filters[key] === undefined) {
          keysToRemove.push(key);
        }
      }
    });
    keysToRemove.forEach(key => currentParams.delete(key));

    // Add new filter params
    Object.entries(params).forEach(([key, value]) => {
      currentParams.set(key, value);
    });

    // Only update if params actually changed
    const newParamsString = currentParams.toString();
    const oldParamsString = searchParams.toString();
    if (newParamsString !== oldParamsString) {
      setSearchParams(currentParams, { replace: true });
    }
  }, [filters, useUrlParams, searchParams, setSearchParams, serializeFilters]);

  /**
   * Restore filters from URL on mount only.
   * Dependencies intentionally omitted to avoid re-running when callbacks/params change.
   */
  useEffect(() => {
    if (!useUrlParams) return;

    const restored = deserializeFilters();
    if (Object.keys(restored).length > 0 && onRestore) {
      onRestore(restored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore from URL only on mount
  }, []);
}

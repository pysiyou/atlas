/**
 * Combines URL-synced entity filters with local filter state for list pages.
 */

import { useCallback, useEffect, useMemo } from 'react';
import type { FilterConfig, FilterValues } from '@/components/filters/types';
import { useFilterState } from '@/components/filters/useFilterState';
import { mergeUrlFiltersIntoValues, type UrlFilterKey } from '@/utils/filters';
import { useUrlFilters } from './useUrlFilters';

export interface UsePageFiltersOptions<T> {
  urlFilterKeys?: readonly UrlFilterKey[];
  initialFilters?: FilterValues;
  filterConfig?: FilterConfig;
  applyFilters?: (items: T[], filters: FilterValues) => T[];
  onFiltersChange?: (filters: FilterValues) => void;
}

export interface UsePageFiltersReturn {
  filters: FilterValues;
  localFilters: FilterValues;
  urlFilters: Partial<Record<UrlFilterKey, string>>;
  setFilter: (key: string, value: unknown) => void;
  setUrlFilter: (key: UrlFilterKey, value: string | number | undefined) => void;
  clearFilter: (key: string) => void;
  clearAll: () => void;
  clearUrlFilters: () => void;
  activeCount: number;
  isActive: boolean;
  isFilterActive: (key: string) => boolean;
  filterConfig?: FilterConfig;
}

export function usePageFilters<T>(
  options: UsePageFiltersOptions<T> = {}
): UsePageFiltersReturn {
  const {
    urlFilterKeys = [],
    initialFilters = {},
    filterConfig,
    onFiltersChange,
  } = options;

  const {
    urlFilters,
    setUrlFilter,
    clearUrlFilters,
  } = useUrlFilters({
    urlFilterKeys,
  });

  const localInitial = useMemo(() => {
    const copy = { ...initialFilters };
    for (const key of urlFilterKeys) {
      delete copy[key];
    }
    return copy;
  }, [initialFilters, urlFilterKeys]);

  const {
    filters: localFilters,
    setFilter: setLocalFilter,
    clearFilter,
    clearAll: clearAllLocal,
    activeCount: localActiveCount,
    isFilterActive,
  } = useFilterState({
    initialFilters: localInitial,
  });

  const filters = useMemo(
    () => mergeUrlFiltersIntoValues(localFilters, urlFilters),
    [localFilters, urlFilters]
  );

  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  const setFilter = useCallback(
    (key: string, value: unknown) => {
      if (urlFilterKeys.includes(key as UrlFilterKey)) {
        setUrlFilter(key as UrlFilterKey, value as string | number);
        return;
      }
      setLocalFilter(key, value);
    },
    [urlFilterKeys, setUrlFilter, setLocalFilter]
  );

  const clearAll = useCallback(() => {
    clearAllLocal();
    clearUrlFilters();
  }, [clearAllLocal, clearUrlFilters]);

  const activeCount = useMemo(() => {
    const urlActive = Object.keys(urlFilters).length;
    return localActiveCount + urlActive;
  }, [localActiveCount, urlFilters]);

  const isActive = activeCount > 0;

  return {
    filters,
    localFilters,
    urlFilters,
    setFilter,
    setUrlFilter,
    clearFilter,
    clearAll,
    clearUrlFilters,
    activeCount,
    isActive,
    isFilterActive,
    filterConfig,
  };
}

/**
 * Applies client-side filter function when items are available outside the hook.
 */
export function applyPageFilters<T>(
  items: T[],
  filters: FilterValues,
  applyFilters?: (items: T[], filters: FilterValues) => T[]
): T[] {
  if (!applyFilters) return items;
  return applyFilters(items, filters);
}

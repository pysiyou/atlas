/** Filter state, URL sync, list page filters, and FilterBar helpers. */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FilterConfig, FilterValues, QuickFilterPreset } from '@/components/filters/types';
import { getDefaultFilterValue, isFilterValueActive } from '@/utils/filterDefaultValues';
import {
  decodeFiltersFromUrl,
  isUrlFilterKey,
  mergeUrlFiltersIntoValues,
  normalizeUrlFilterValue,
  type UrlFilterKey,
  type UrlFilters,
} from '@/utils/filters';

export { isUrlFilterKey };

export interface FeatureFilterBarConfig<T extends FilterValues> {
  config: FilterConfig;
  keys: Array<keyof T & string>;
}

type FilterHandlers<T extends FilterValues> = {
  [K in keyof T]?: (next: T[K]) => void;
};

/**
 * Builds a stable FilterBar value object and an onChange that only fires handlers
 * when a key actually changed.
 *
 * @param value - Current filter snapshot keyed the same as FilterConfig control keys.
 * @param handlers - Per-key setters. Keys missing from `next` are ignored.
 */
export function useFilterBarBridge<T extends FilterValues>(value: T, handlers: FilterHandlers<T>) {
  const filterValues = useMemo(() => value, [value]);

  const handleFilterChange = (next: FilterValues) => {
    (Object.keys(handlers) as Array<keyof T>).forEach(key => {
      const handler = handlers[key];
      if (!handler) return;
      if (next[key as string] === undefined) return;
      if (next[key as string] === value[key]) return;
      handler(next[key as string] as T[typeof key]);
    });
  };

  return { filterValues, handleFilterChange };
}

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
  /** Set all filters at once (for controlled sync) */
  setFilters: (filters: FilterValues) => void;
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
   * onChange is deferred to avoid updating parent (e.g. SampleCollectionQueue) during FilterBar's setState.
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
    setFilters,
    activeCount,
    isActive,
    isFilterActive,
  };
}

export interface UseQuickFiltersOptions {
  /** Available quick filter presets */
  presets: QuickFilterPreset[];
  /** Current filter values */
  filters: FilterValues;
  /** Callback when a preset is applied */
  onApplyPreset: (preset: QuickFilterPreset) => void;
}

/**
 * Return type for useQuickFilters hook
 */
export interface UseQuickFiltersReturn {
  /** Check if a preset is currently active */
  isPresetActive: (presetId: string) => boolean;
  /** Apply a preset */
  applyPreset: (presetId: string) => void;
  /** Get active preset ID if any */
  activePresetId: string | null;
}

/**
 * Hook for managing quick filter presets
 *
 * @param options - Configuration options
 * @returns Quick filter functions
 *
 * @example
 * ```typescript
 * const { isPresetActive, applyPreset, activePresetId } = useQuickFilters({
 *   presets: [
 *     { id: 'today', label: 'Today', preset: { dateRange: [today, today] } },
 *   ],
 *   filters: currentFilters,
 *   onApplyPreset: (preset) => setFilters(preset.preset),
 * });
 * ```
 */
export function useQuickFilters(options: UseQuickFiltersOptions): UseQuickFiltersReturn {
  const { presets, filters, onApplyPreset } = options;

  /**
   * Check if a preset matches current filters
   */
  const isPresetActive = useCallback(
    (presetId: string) => {
      const preset = presets.find(p => p.id === presetId);
      if (!preset) return false;

      // Check if all preset values match current filters
      return Object.entries(preset.preset).every(([key, presetValue]) => {
        const currentValue = filters[key];

        // Handle arrays
        if (Array.isArray(presetValue) && Array.isArray(currentValue)) {
          if (presetValue.length !== currentValue.length) return false;
          return presetValue.every((val, idx) => {
            const current = currentValue[idx];
            if (val instanceof Date && current instanceof Date) {
              return val.getTime() === current.getTime();
            }
            return val === current;
          });
        }

        // Handle dates
        if (presetValue instanceof Date && currentValue instanceof Date) {
          return presetValue.getTime() === currentValue.getTime();
        }

        // Handle primitives
        return presetValue === currentValue;
      });
    },
    [presets, filters]
  );

  /**
   * Apply a preset
   */
  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = presets.find(p => p.id === presetId);
      if (preset) {
        onApplyPreset(preset);
      }
    },
    [presets, onApplyPreset]
  );

  /**
   * Find active preset ID
   */
  const activePresetId = presets.find(preset => isPresetActive(preset.id))?.id || null;

  return {
    isPresetActive,
    applyPreset,
    activePresetId,
  };
}

export interface UseUrlFiltersOptions {
  /** Which entity keys this page reads and writes in the URL. */
  urlFilterKeys: readonly UrlFilterKey[];
  /** Called when URL-backed filters change (including back/forward). */
  onFiltersChange?: (filters: UrlFilters) => void;
}

export interface UseUrlFiltersReturn {
  urlFilters: UrlFilters;
  setUrlFilter: (key: UrlFilterKey, value: string | number | null | undefined) => void;
  /** Replace all URL entity filters on this page (clears other entity keys). */
  setUrlFilters: (filters: UrlFilters) => void;
  clearUrlFilters: () => void;
  hasUrlFilters: boolean;
}

export function useUrlFilters(options: UseUrlFiltersOptions): UseUrlFiltersReturn {
  const { urlFilterKeys, onFiltersChange } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  const urlFilters = useMemo(
    () => decodeFiltersFromUrl(searchParams, urlFilterKeys),
    [searchParams, urlFilterKeys]
  );

  const hasUrlFilters = useMemo(
    () => Object.keys(urlFilters).length > 0,
    [urlFilters]
  );

  const applyParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      setSearchParams(next, { replace: false });
      const decoded = decodeFiltersFromUrl(next, urlFilterKeys);
      queueMicrotask(() => onFiltersChange?.(decoded));
    },
    [searchParams, setSearchParams, urlFilterKeys, onFiltersChange]
  );

  const setUrlFilter = useCallback(
    (key: UrlFilterKey, value: string | number | null | undefined) => {
      if (!urlFilterKeys.includes(key)) return;
      const normalized = normalizeUrlFilterValue(value);
      applyParams(params => {
        // Only modify the specified key, don't touch other entity filters
        if (normalized !== undefined) {
          params.set(key, normalized);
        } else {
          params.delete(key);
        }
      });
    },
    [applyParams, urlFilterKeys]
  );

  const setUrlFilters = useCallback(
    (filters: UrlFilters) => {
      applyParams(params => {
        for (const entityKey of urlFilterKeys) {
          params.delete(entityKey);
        }
        for (const key of urlFilterKeys) {
          const normalized = normalizeUrlFilterValue(filters[key]);
          if (normalized !== undefined) {
            params.set(key, normalized);
          }
        }
      });
    },
    [applyParams, urlFilterKeys]
  );

  const clearUrlFilters = useCallback(() => {
    applyParams(params => {
      for (const key of urlFilterKeys) {
        params.delete(key);
      }
    });
  }, [applyParams, urlFilterKeys]);

  return {
    urlFilters,
    setUrlFilter,
    setUrlFilters,
    clearUrlFilters,
    hasUrlFilters,
  };
}

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

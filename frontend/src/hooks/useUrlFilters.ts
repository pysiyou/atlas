/**
 * Syncs entity id filters with URL query parameters.
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  decodeFiltersFromUrl,
  isUrlFilterKey,
  normalizeUrlFilterValue,
  type UrlFilterKey,
  type UrlFilters,
} from '@/utils/filters';

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

export { isUrlFilterKey };

/** Debounce, server list pagination state, entity lookup. */

import { useCallback, useEffect, useMemo, useState, type SetStateAction } from 'react';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function usePaginatedPageSize(initialPageSize = DEFAULT_LIST_PAGE_SIZE) {
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
  }, []);

  return { pageSize, setPageSize };
}

export function useResettablePage(
  initialPage: number,
  filterSnapshot: string
): [number, (action: SetStateAction<number>) => void] {
  const resetKey = `${filterSnapshot}\0${initialPage}`;
  const [state, setState] = useState({ resetKey, page: initialPage });

  if (state.resetKey !== resetKey) {
    setState({ resetKey, page: initialPage });
  }

  const setPage = useCallback((action: SetStateAction<number>) => {
    setState(current => ({
      ...current,
      page: typeof action === 'function' ? action(current.page) : action,
    }));
  }, []);

  return [state.page, setPage];
}

export interface UseEntityLookupOptions<K extends string | number> {
  isLoading?: boolean;
  normalizeKey?: (key: string | number) => K | undefined;
}

export function useEntityLookup<T, K extends string | number>(
  items: T[] | undefined,
  getKey: (item: T) => K,
  options: UseEntityLookupOptions<K> = {}
) {
  const { isLoading = false, normalizeKey } = options;

  const map = useMemo(() => {
    const entityMap = new Map<K, T>();
    items?.forEach(item => entityMap.set(getKey(item), item));
    return entityMap;
  }, [items, getKey]);

  const get = useCallback(
    (key: string | number): T | undefined => {
      const normalized = normalizeKey ? normalizeKey(key) : (key as K);
      if (normalized === undefined) return undefined;
      return map.get(normalized);
    },
    [map, normalizeKey]
  );

  return { get, map, isLoading };
}

export function parseNumericKey(key: string | number): number | undefined {
  const numericId = typeof key === 'string' ? parseInt(key, 10) : key;
  return Number.isNaN(numericId) ? undefined : numericId;
}
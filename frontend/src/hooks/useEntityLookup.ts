/**
 * useEntityLookup — generic Map-based entity lookup from a cached list.
 */

import { useCallback, useMemo } from 'react';

export interface UseEntityLookupOptions<K extends string | number> {
  isLoading?: boolean;
  /** Normalize lookup keys (e.g. parse string IDs to numbers). */
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

/** Parse numeric entity IDs from string or number keys. */
export function parseNumericKey(key: string | number): number | undefined {
  const numericId = typeof key === 'string' ? parseInt(key, 10) : key;
  return Number.isNaN(numericId) ? undefined : numericId;
}

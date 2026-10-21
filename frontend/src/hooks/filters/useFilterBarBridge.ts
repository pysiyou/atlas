/**
 * Maps FilterBar `FilterValues` back to typed list-page callbacks without copy-pasted key diffs.
 */

import { useMemo } from 'react';
import type { FilterValues } from '@/components/filters/types';

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

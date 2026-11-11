/**
 * Wired FilterBar for list pages: typed value + handlers + declarative config.
 */

import { FilterBar } from './FilterBar';
import type { FilterConfig } from './types';
import type { FilterValues } from './types';
import { useFilterBarBridge } from '@/hooks/filters/useFilterBarBridge';

type FilterHandlers<T extends FilterValues> = {
  [K in keyof T]?: (next: T[K]) => void;
};

export interface FeatureFilterBarProps<T extends FilterValues> {
  config: FilterConfig;
  value: T;
  handlers: FilterHandlers<T>;
}

/**
 * FilterBar wired to typed list-page values and per-key change handlers.
 *
 * @param config - Declarative filter control tree
 * @param value - Current filter values from list chrome
 * @param handlers - Per-key setters (missing keys are ignored)
 */
export function FeatureFilterBar<T extends FilterValues>({
  config,
  value,
  handlers,
}: FeatureFilterBarProps<T>) {
  const { filterValues, handleFilterChange } = useFilterBarBridge(value, handlers);
  return <FilterBar config={config} value={filterValues} onChange={handleFilterChange} />;
}

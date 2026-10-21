import { FilterBar } from '@/components/filters';
import type { FilterConfig } from '@/components/filters';
import type { FilterValues } from '@/components/filters/types';
import { useFilterBarBridge } from './useFilterBarBridge';

type FilterHandlers<T extends FilterValues> = {
  [K in keyof T]?: (next: T[K]) => void;
};

export interface FeatureFilterBarProps<T extends FilterValues> {
  config: FilterConfig;
  value: T;
  handlers: FilterHandlers<T>;
}

/** Wired FilterBar for list pages: typed value + handlers + declarative config. */
export function FeatureFilterBar<T extends FilterValues>({
  config,
  value,
  handlers,
}: FeatureFilterBarProps<T>) {
  const { filterValues, handleFilterChange } = useFilterBarBridge(value, handlers);
  return <FilterBar config={config} value={filterValues} onChange={handleFilterChange} />;
}

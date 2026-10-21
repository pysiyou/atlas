import type { FilterConfig } from '@/components/filters/types';
import type { FilterValues } from '@/components/filters/types';

/**
 * Declarative shape for feature list filter bars: FilterBar config + typed value keys.
 */
export interface FeatureFilterBarConfig<T extends FilterValues> {
  config: FilterConfig;
  keys: Array<keyof T & string>;
}

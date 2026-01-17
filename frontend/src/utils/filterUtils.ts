import type { FilterOption } from '@/shared/ui';

/**
 * Creates an array of FilterOption objects derived from a readonly array of values and a configuration object.
 *
 * @param values - Array of values (e.g., from 'as const' array or enum values)
 * @param config - Configuration record mapping each value to label and color
 * @returns Array of FilterOption objects typically used in MultiSelectFilter
 */
export function createFilterOptions<T extends string>(
  values: readonly T[],
  config: Record<T, { label: string; color?: string }>
): FilterOption[] {
  return values.map((value) => ({
    id: value,
    label: config[value].label,
    color: config[value].color,
  }));
}

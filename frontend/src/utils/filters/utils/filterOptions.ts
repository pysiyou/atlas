/**
 * Filter Options Utility
 * Helper function for creating filter option arrays
 */

import type { FilterOption } from '../types';

/**
 * Creates an array of FilterOption objects from a values array and configuration
 *
 * The `color` field in FilterOption is used as the Badge variant. The Badge component
 * determines the actual colors based on the variant. By default, the value itself
 * is used as the color/variant (e.g., "pending" maps to Badge's pending style).
 *
 * @param values - Array of values (e.g., from 'as const' array or enum values)
 * @param config - Configuration record mapping each value to label
 * @returns Array of FilterOption objects for use in MultiSelectFilter
 *
 * @example
 * ```typescript
 * const ORDER_STATUS_VALUES = ['pending', 'processing', 'completed'] as const;
 * const ORDER_STATUS_CONFIG = {
 *   pending: { label: 'Pending' },
 *   processing: { label: 'Processing' },
 *   completed: { label: 'Completed' },
 * };
 *
 * const filterOptions = createFilterOptions(ORDER_STATUS_VALUES, ORDER_STATUS_CONFIG);
 * // Result: [{ id: 'pending', label: 'Pending', color: 'pending' }, ...]
 * // Badge will use 'pending' as variant to determine its color
 * ```
 */
export function createFilterOptions<T extends string>(
  values: readonly T[],
  config: Record<T, { label: string }>
): FilterOption[] {
  // Use the value itself as the color/variant - Badge component determines actual colors
  return values.map(value => ({
    id: value,
    label: config[value].label,
    color: value, // Pass value as Badge variant
  }));
}

/**
 * Filtering Utility Functions
 * Helper functions for creating filter options and configurations
 */

import type { FilterOption } from './types';

/**
 * Creates an array of FilterOption objects from a values array and configuration
 * 
 * @param values - Array of values (e.g., from 'as const' array or enum values)
 * @param config - Configuration record mapping each value to label and color
 * @returns Array of FilterOption objects for use in MultiSelectFilter
 * 
 * @example
 * ```typescript
 * const ORDER_STATUS_VALUES = ['pending', 'processing', 'completed'] as const;
 * const ORDER_STATUS_CONFIG = {
 *   pending: { label: 'Pending', color: 'yellow' },
 *   processing: { label: 'Processing', color: 'blue' },
 *   completed: { label: 'Completed', color: 'green' },
 * };
 * 
 * const filterOptions = createFilterOptions(ORDER_STATUS_VALUES, ORDER_STATUS_CONFIG);
 * // Result: [{ id: 'pending', label: 'Pending', color: 'yellow' }, ...]
 * ```
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

/**
 * Creates filter options from a simple label map
 * 
 * @example
 * ```typescript
 * const options = createSimpleFilterOptions({
 *   active: 'Active',
 *   inactive: 'Inactive',
 * });
 * ```
 */
export function createSimpleFilterOptions<T extends string>(
  labelMap: Record<T, string>
): FilterOption[] {
  return Object.entries(labelMap).map(([id, label]) => ({
    id,
    label: label as string,
  }));
}

/**
 * Checks if any filters are active
 * 
 * @example
 * ```typescript
 * const hasFilters = hasActiveFilters({
 *   searchQuery: 'john',
 *   statusFilters: ['active'],
 *   dateRange: null,
 * });
 * ```
 */
export function hasActiveFilters(filters: {
  searchQuery?: string;
  statusFilters?: string[];
  dateRange?: [Date, Date] | null;
  [key: string]: unknown;
}): boolean {
  if (filters.searchQuery?.trim()) return true;
  if (filters.statusFilters?.length) return true;
  if (filters.dateRange) return true;
  return false;
}

/**
 * Generates a filter summary string
 * 
 * @example
 * ```typescript
 * const summary = getFilterSummary({
 *   searchQuery: 'john',
 *   statusFilters: ['active', 'pending'],
 * });
 * // Result: 'Search: "john", Status: active, pending'
 * ```
 */
export function getFilterSummary(filters: {
  searchQuery?: string;
  statusFilters?: string[];
  dateRange?: [Date, Date] | null;
}): string {
  const parts: string[] = [];

  if (filters.searchQuery?.trim()) {
    parts.push(`Search: "${filters.searchQuery}"`);
  }

  if (filters.statusFilters?.length) {
    parts.push(`Status: ${filters.statusFilters.join(', ')}`);
  }

  if (filters.dateRange) {
    const [start, end] = filters.dateRange;
    parts.push(`Date: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`);
  }

  return parts.join(', ') || 'No filters applied';
}

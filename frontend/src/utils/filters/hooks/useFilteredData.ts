/**
 * useFilteredData Hook
 * Centralized hook for applying filters to data arrays based on filter configuration
 */

import { useMemo } from 'react';
import type { FilterConfig, FilterValues, FilterControl } from '../types';
import {
  applySearchFilter,
  applyMultiSelectFilter,
  applySingleSelectFilter,
  applyDateRangeFilter,
  applyNumericRangeFilter,
  applyAgeRangeFilter,
} from '../utils';

/**
 * Options for useFilteredData hook
 */
export interface UseFilteredDataOptions<T> {
  /** Items to filter */
  items: T[];
  /** Current filter values */
  filterValues: FilterValues;
  /** Filter configuration */
  filterConfig: FilterConfig;
  /** Custom filter functions for complex logic (key -> filter function) */
  customFilters?: Record<string, (item: T, value: unknown) => boolean>;
  /** Custom search fields function (overrides default search behavior) */
  customSearchFields?: (item: T) => string[];
  /** Custom date getter function (for date range filters) */
  customDateGetter?: (item: T, field: string) => Date | string | null | undefined;
  /** Custom numeric value getter (for range filters) */
  customNumericGetter?: (item: T, field: string) => number | null | undefined;
  /** Custom age calculator (for age range filters) */
  customAgeCalculator?: (item: T) => number | null | undefined;
}

/**
 * Hook for applying filters to data based on filter configuration
 *
 * @param options - Configuration options
 * @returns Filtered items array
 *
 * @example
 * ```typescript
 * const filteredItems = useFilteredData({
 *   items: tests,
 *   filterValues: { searchQuery: 'test', category: ['hematology'] },
 *   filterConfig: catalogFilterConfig,
 *   customSearchFields: (test) => [test.name, test.code, ...test.synonyms || []],
 * });
 * ```
 */
export function useFilteredData<T>(options: UseFilteredDataOptions<T>): T[] {
  const {
    items,
    filterValues,
    filterConfig,
    customFilters = {},
    customSearchFields,
    customDateGetter,
    customNumericGetter,
    customAgeCalculator,
  } = options;

  return useMemo(() => {
    let filtered = [...items];

    /**
     * Get all controls from primary and advanced filters
     */
    const allControls: FilterControl[] = [
      ...filterConfig.primaryFilters.controls,
      ...(filterConfig.advancedFilters?.controls || []),
    ];

    /**
     * Apply each filter control
     */
    for (const control of allControls) {
      const filterValue = filterValues[control.key];

      // Skip if no value or custom filter exists
      if (customFilters[control.key]) {
        filtered = filtered.filter(item => customFilters[control.key]!(item, filterValue));
        continue;
      }

      // Apply based on control type
      switch (control.type) {
        case 'search': {
          const query = (filterValue as string) || '';
          if (customSearchFields) {
            filtered = applySearchFilter(filtered, query, customSearchFields);
          } else {
            // Default: search in all string fields (basic fallback)
            filtered = applySearchFilter(
              filtered,
              query,
              item => Object.values(item as Record<string, unknown>).map(v => String(v ?? ''))
            );
          }
          break;
        }

        case 'multiSelect': {
          const values = (filterValue as string[]) || [];
          if (values.length > 0) {
            // Try to find the field in the item
            const fieldName = control.key;
            filtered = applyMultiSelectFilter(filtered, values, fieldName as keyof T);
          }
          break;
        }

        case 'singleSelect': {
          const value = filterValue as string | null | undefined;
          if (value) {
            const fieldName = control.key;
            filtered = applySingleSelectFilter(filtered, value, fieldName as keyof T);
          }
          break;
        }

        case 'dateRange': {
          const range = filterValue as [Date, Date] | null;
          if (range) {
            if (customDateGetter) {
              // For dateRange, typically we want to filter by orderDate or similar field
              // Pass the control key, but customDateGetter should map it to the actual date field
              filtered = applyDateRangeFilter(
                filtered,
                range,
                item => customDateGetter(item, control.key)
              );
            } else {
              // Default: try common date field names
              filtered = applyDateRangeFilter(
                filtered,
                range,
                item => {
                  const dateField = (item as Record<string, unknown>).orderDate ||
                                   (item as Record<string, unknown>).date ||
                                   (item as Record<string, unknown>)[control.key];
                  return dateField as Date | string | null | undefined;
                }
              );
            }
          }
          break;
        }

        case 'priceRange': {
          const range = (filterValue as [number, number]) || [control.min ?? 0, control.max ?? 10000];
          const defaults: [number, number] = [control.min ?? 0, control.max ?? 10000];
          const fieldName = control.key;
          if (customNumericGetter) {
            filtered = applyNumericRangeFilter(
              filtered,
              range,
              item => customNumericGetter!(item, fieldName),
              defaults
            );
          } else {
            // Default: assume field is a number
            filtered = applyNumericRangeFilter(
              filtered,
              range,
              item => (item as Record<string, unknown>)[fieldName] as number | null | undefined,
              defaults
            );
          }
          break;
        }

        case 'ageRange': {
          const range = (filterValue as [number, number]) || [control.min ?? 0, control.max ?? 150];
          const defaults: [number, number] = [control.min ?? 0, control.max ?? 150];
          if (customAgeCalculator) {
            filtered = applyAgeRangeFilter(filtered, range, customAgeCalculator, defaults);
          } else {
            // Age range requires custom calculator - skip if not provided
            // This is expected since age calculation is domain-specific
          }
          break;
        }
      }
    }

    return filtered;
  }, [items, filterValues, filterConfig, customFilters, customSearchFields, customDateGetter, customNumericGetter, customAgeCalculator]);
}

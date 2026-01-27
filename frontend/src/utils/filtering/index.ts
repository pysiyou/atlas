/**
 * Filtering Module (Legacy)
 * 
 * ⚠️ DEPRECATED: For new code, use @/utils/filters instead.
 * 
 * This module is kept for backward compatibility with:
 * - useFiltering, useSearch, useMultiSelect hooks
 * - Legacy filter functions
 * 
 * Shared utilities (FilterOption, createFilterOptions) are now in @/utils/filters
 * and re-exported here for backward compatibility.
 *
 * @example
 * ```typescript
 * // OLD (deprecated):
 * import { useFiltering } from '@/utils/filtering';
 * 
 * // NEW (preferred):
 * import { FilterBar, useFilteredData } from '@/utils/filters';
 * ```
 */

// Re-export shared types and utilities from centralized filters
export type { FilterOption } from '@/utils/filters';
export { createFilterOptions } from '@/utils/filters';

// Legacy types (still used by old hooks)
export type {
  SortDirection,
  SortConfig,
  UseFilteringOptions,
  UseFilteringReturn,
} from './types';

// Legacy hooks (kept for backward compatibility)
export { useFiltering, useSearch, useMultiSelect } from './hooks';

// Legacy filter functions (kept for backward compatibility)
export {
  createSearchFilter,
  createMultiFieldFilter,
  createDateRangeFilter,
  createStatusFilter,
  combineFilters,
  filterByMultipleCriteria,
  sortItems,
} from './filters';

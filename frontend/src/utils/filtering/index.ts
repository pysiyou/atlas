/**
 * Filtering Module
 * Consolidated filtering utilities, hooks, and types
 *
 * @example
 * ```typescript
 * // Import hooks
 * import { useFiltering, useSearch, useMultiSelect } from '@/utils/filtering';
 *
 * // Import filter functions
 * import { createSearchFilter, combineFilters } from '@/utils/filtering';
 *
 * // Import utility functions
 * import { createFilterOptions } from '@/utils/filtering';
 *
 * // Import types
 * import type { FilterOption, SortConfig } from '@/utils/filtering';
 * ```
 */

// Types
export type {
  SortDirection,
  SortConfig,
  FilterOption,
  UseFilteringOptions,
  UseFilteringReturn,
} from './types';

// Hooks
export { useFiltering, useSearch, useMultiSelect } from './hooks';

// Pure filter functions
export {
  createSearchFilter,
  createMultiFieldFilter,
  createDateRangeFilter,
  createStatusFilter,
  combineFilters,
  filterByMultipleCriteria,
  sortItems,
} from './filters';

// Utility functions
export { createFilterOptions } from './utils';

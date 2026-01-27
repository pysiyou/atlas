/**
 * Filtering Types
 * Type definitions for filtering utilities
 */

/**
 * Sort direction for list sorting
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Configuration for sorting
 */
export interface SortConfig<T> {
  field: keyof T;
  direction: SortDirection;
}

/**
 * Filter option for multi-select filters
 * 
 * ⚠️ DEPRECATED: This type is now in @/utils/filters.
 * Re-exported here for backward compatibility only.
 */
export type { FilterOption } from '@/utils/filters';

/**
 * Options for the useFiltering hook
 */
export interface UseFilteringOptions<T, S extends string = string> {
  /** Function to get searchable string fields from an item */
  searchFields?: (item: T) => string[];
  /** Default sort configuration */
  defaultSort?: SortConfig<T>;
  /** Field to use for status filtering */
  statusField?: keyof T;
  /** Initial status filters */
  initialStatusFilters?: S[];
}

/**
 * Return type for the useFiltering hook
 */
export interface UseFilteringReturn<T, S extends string = string> {
  /** Filtered and sorted items */
  filteredItems: T[];
  /** Current search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Current status filters */
  statusFilters: S[];
  /** Set status filters */
  setStatusFilters: (filters: S[]) => void;
  /** Toggle a status filter */
  toggleStatusFilter: (status: S) => void;
  /** Current sort configuration */
  sortConfig: SortConfig<T> | null;
  /** Set sort field and direction */
  setSort: (field: keyof T, direction?: SortDirection) => void;
  /** Toggle sort direction for a field */
  toggleSort: (field: keyof T) => void;
  /** Whether the filtered result is empty */
  isEmpty: boolean;
  /** Whether search is active */
  hasActiveSearch: boolean;
  /** Clear all filters */
  clearFilters: () => void;
}

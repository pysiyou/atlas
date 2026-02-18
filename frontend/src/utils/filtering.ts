/**
 * Filtering Utilities — pure functions and types only.
 * React hooks (useFiltering, useSearch, useMultiSelect) live in @/hooks/useFiltering.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  field: keyof T;
  direction: SortDirection;
}

export interface FilterOption {
  id: string;
  label: string;
  color?: string;
}

export interface UseFilteringOptions<T, S extends string = string> {
  searchFields?: (item: T) => string[];
  defaultSort?: SortConfig<T>;
  statusField?: keyof T;
  initialStatusFilters?: S[];
}

export interface UseFilteringReturn<T, S extends string = string> {
  filteredItems: T[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilters: S[];
  setStatusFilters: (filters: S[]) => void;
  toggleStatusFilter: (status: S) => void;
  sortConfig: SortConfig<T> | null;
  setSort: (field: keyof T, direction?: SortDirection) => void;
  toggleSort: (field: keyof T) => void;
  isEmpty: boolean;
  hasActiveSearch: boolean;
  clearFilters: () => void;
}

// ---------------------------------------------------------------------------
// Pure Filter Functions
// ---------------------------------------------------------------------------

export const createSearchFilter =
  <T>(searchFields: (item: T) => string[]) =>
  (item: T, query: string): boolean => {
    if (!query.trim()) return true;
    const lowerQuery = query.toLowerCase();
    return searchFields(item).some(field => field.toLowerCase().includes(lowerQuery));
  };

export const createMultiFieldFilter =
  <T>(fields: Array<keyof T>) =>
  (item: T, query: string): boolean => {
    if (!query.trim()) return true;
    const lowerQuery = query.toLowerCase();
    return fields.some(field => {
      const value = item[field];
      if (typeof value === 'string') return value.toLowerCase().includes(lowerQuery);
      if (typeof value === 'number') return value.toString().includes(query);
      return false;
    });
  };

export const createDateRangeFilter =
  <T>(dateField: keyof T) =>
  (item: T, startDate?: Date, endDate?: Date): boolean => {
    const value = item[dateField];
    if (!(value instanceof Date) && typeof value !== 'string') return true;
    const itemDate = value instanceof Date ? value : new Date(value);
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    return true;
  };

export const createStatusFilter =
  <T, S extends string>(statusField: keyof T) =>
  (item: T, allowedStatuses: S[]): boolean => {
    if (allowedStatuses.length === 0) return true;
    return allowedStatuses.includes(item[statusField] as S);
  };

export const combineFilters =
  <T>(...filters: Array<(item: T) => boolean>) =>
  (item: T): boolean =>
    filters.every(filter => filter(item));

export const filterByMultipleCriteria = <T>(
  items: T[],
  criteria: Array<(item: T) => boolean>
): T[] =>
  items.filter(item => criteria.every(criterion => criterion(item)));

export const sortItems = <T>(
  items: T[],
  field: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] =>
  [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    let comparison = 0;
    if (aVal < bVal) comparison = -1;
    if (aVal > bVal) comparison = 1;
    return direction === 'desc' ? -comparison : comparison;
  });

// ---------------------------------------------------------------------------
// Filter Option Builder
// ---------------------------------------------------------------------------

export function createFilterOptions<T extends string>(
  values: readonly T[],
  config: Record<T, { label: string }>
): FilterOption[] {
  return values.map(value => ({
    id: value,
    label: config[value].label,
    color: value,
  }));
}

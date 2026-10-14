/**
 * Filtering Utilities — pure functions and types only.
 * React hook useClientListFilter lives in @/hooks/useClientListFilter.
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

export interface UseClientListFilterOptions<T, S extends string = string> {
  searchFields?: (item: T) => string[];
  defaultSort?: SortConfig<T>;
  statusField?: keyof T;
  initialStatusFilters?: S[];
}

export interface UseClientListFilterReturn<T, S extends string = string> {
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

/**
 * Serializes a multi-select filter as a comma-separated query param.
 * Empty or whitespace-only values are omitted.
 */
export function serializeQueryList(values: readonly string[] | undefined): string | undefined {
  if (!values || values.length === 0) return undefined;
  const unique = [...new Set(values.map(value => value.trim()).filter(Boolean))];
  return unique.length > 0 ? unique.join(',') : undefined;
}

/**
 * Parses a comma-separated query param into a list of non-empty tokens.
 */
export function parseQueryList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map(token => token.trim())
    .filter(Boolean);
}

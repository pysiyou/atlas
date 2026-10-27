/** Filtering utilities — pure functions and shared sort/filter types. */

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

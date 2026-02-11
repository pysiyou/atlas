/**
 * Shared helpers for filter default values and "is active" checks.
 * Used by useFilterState to avoid duplicating type-based heuristics.
 */

/** Default price range when clearing. */
const DEFAULT_PRICE_RANGE: [number, number] = [0, 10_000];
/** Default age range when clearing. */
const DEFAULT_AGE_RANGE: [number, number] = [0, 150];

/**
 * Heuristic: value looks like a price range (max in thousands).
 */
function isPriceRangeKeyOrValue(key: string, value: unknown): boolean {
  if (key === 'priceRange') return true;
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  ) {
    return value[1] > 1000 && value[1] <= 100_000;
  }
  return false;
}

/**
 * Returns the default (cleared) value for a filter given its key and current value.
 */
export function getDefaultFilterValue(key: string, value: unknown): unknown {
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    value[0] instanceof Date &&
    value[1] instanceof Date
  ) {
    return null;
  }
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  ) {
    return isPriceRangeKeyOrValue(key, value) ? DEFAULT_PRICE_RANGE : DEFAULT_AGE_RANGE;
  }
  if (Array.isArray(value)) return [];
  if (value instanceof Date) return null;
  if (typeof value === 'string') return '';
  if (typeof value === 'number') return null;
  return null;
}

/**
 * Returns whether the filter value is considered "active" (non-empty / non-default).
 */
export function isFilterValueActive(key: string, value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    if (value.length === 2) {
      if (value[0] instanceof Date && value[1] instanceof Date) return true;
      if (typeof value[0] === 'number' && typeof value[1] === 'number') {
        const isPrice = isPriceRangeKeyOrValue(key, value);
        if (isPrice) return !(value[0] === DEFAULT_PRICE_RANGE[0] && value[1] === DEFAULT_PRICE_RANGE[1]);
        return !(value[0] === DEFAULT_AGE_RANGE[0] && value[1] === DEFAULT_AGE_RANGE[1]);
      }
    }
    return value.length > 0;
  }
  if (value instanceof Date) return true;
  return true;
}

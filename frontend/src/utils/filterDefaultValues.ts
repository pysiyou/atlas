/**
 * Default filter values and active-state heuristics for useFilterState.
 */

const DEFAULT_TRACK_RANGE: [number, number] = [0, 10_000];
const DEFAULT_HISTOGRAM_RANGE: [number, number] = [0, 150];

function isTrackRangeKeyOrValue(key: string, value: unknown): boolean {
  if (key === 'priceRange' || key.endsWith('Price')) return true;
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
    return isTrackRangeKeyOrValue(key, value) ? DEFAULT_TRACK_RANGE : DEFAULT_HISTOGRAM_RANGE;
  }
  if (Array.isArray(value)) return [];
  if (value instanceof Date) return null;
  if (typeof value === 'string') return '';
  if (typeof value === 'number') return null;
  return null;
}

export function isFilterValueActive(_key: string, value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.length > 0;
  if (typeof value === 'number') return true;
  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    if (value.length === 2 && value[0] instanceof Date) return true;
    if (value.length === 2 && typeof value[0] === 'number') {
      return !(value[0] === 0 && (value[1] === 150 || value[1] === 10_000));
    }
    return true;
  }
  return true;
}

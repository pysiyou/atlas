/**
 * Encode and decode URL-synced entity filters for cross-page navigation.
 */

import type { FilterValues } from '@/components/filters/types';

/** Query param keys used for deep-linked entity filters. */
export const URL_FILTER_KEYS = ['patientId', 'orderId', 'sampleId', 'testId'] as const;

export type UrlFilterKey = (typeof URL_FILTER_KEYS)[number];

/** Parsed entity filters from the URL. */
export type UrlFilters = Partial<Record<UrlFilterKey, string>>;

function isUrlFilterKey(key: string): key is UrlFilterKey {
  return (URL_FILTER_KEYS as readonly string[]).includes(key);
}

/**
 * Normalizes an entity id for URL storage (non-empty string).
 */
export function normalizeUrlFilterValue(value: string | number | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Decodes entity filter params from URLSearchParams.
 */
export function decodeFiltersFromUrl(
  searchParams: URLSearchParams,
  keys: readonly UrlFilterKey[] = URL_FILTER_KEYS
): UrlFilters {
  const result: UrlFilters = {};
  for (const key of keys) {
    const raw = searchParams.get(key);
    const normalized = normalizeUrlFilterValue(raw ?? undefined);
    if (normalized !== undefined) {
      result[key] = normalized;
    }
  }
  return result;
}

/**
 * Writes entity filters into URLSearchParams (does not clear unrelated params).
 */
export function encodeFiltersToSearchParams(
  filters: UrlFilters,
  keys: readonly UrlFilterKey[] = URL_FILTER_KEYS
): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of keys) {
    const value = normalizeUrlFilterValue(filters[key]);
    if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params;
}

/**
 * Merges URL entity filters into a FilterValues object (string values under entity keys).
 */
export function mergeUrlFiltersIntoValues(
  current: FilterValues,
  urlFilters: UrlFilters
): FilterValues {
  return { ...current, ...urlFilters };
}

/**
 * Builds a path with query string from entity filters.
 */
export function buildFilteredUrl(
  basePath: string,
  filters: UrlFilters,
  options?: { preserveParams?: URLSearchParams; replaceEntityFilters?: boolean }
): string {
  const { preserveParams, replaceEntityFilters = true } = options ?? {};
  const params = new URLSearchParams(preserveParams?.toString() ?? '');

  if (replaceEntityFilters) {
    for (const key of URL_FILTER_KEYS) {
      params.delete(key);
    }
  }

  for (const key of URL_FILTER_KEYS) {
    const value = normalizeUrlFilterValue(filters[key]);
    if (value !== undefined) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * Returns only keys present in urlFilters that are allowed for the page.
 */
export function pickUrlFiltersForPage(
  urlFilters: UrlFilters,
  allowedKeys: readonly UrlFilterKey[]
): UrlFilters {
  const picked: UrlFilters = {};
  for (const key of allowedKeys) {
    if (urlFilters[key] !== undefined) {
      picked[key] = urlFilters[key];
    }
  }
  return picked;
}

export { isUrlFilterKey };

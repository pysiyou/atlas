/**
 * URL-synced entity filters: encode/decode and cross-page navigation.
 */

import type { NavigateFunction } from 'react-router-dom';
import type { FilterValues } from '@/components/filters/types';
import { ROUTES } from '@/config';
import { displayId } from '@/utils/id';

/** Lab URL segments under {@link ROUTES.LABORATORY} (aligned with `LAB_TAB_IDS` in lab constants). */
type LabTabId = 'collection' | 'entry' | 'validation' | 'monitor';

function getLabTabPath(tab: LabTabId): string {
  return `${ROUTES.LABORATORY}/${tab}`;
}

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

/**
 * Navigates to a path with entity filters (replaces other entity filter params).
 */
export function navigateWithUrlFilters(
  navigate: NavigateFunction,
  basePath: string,
  filters: UrlFilters,
  options?: { replace?: boolean }
): void {
  const path = buildFilteredUrl(basePath, filters);
  navigate(path, { replace: options?.replace ?? false });
}

export function navigateToOrdersWithPatient(
  navigate: NavigateFunction,
  patientId: string | number
): void {
  const id = normalizeUrlFilterValue(patientId);
  if (!id) return;
  navigateWithUrlFilters(navigate, ROUTES.ORDERS, { patientId: id });
}

export function navigateToOrdersWithOrder(
  navigate: NavigateFunction,
  orderId: string | number
): void {
  const id = normalizeUrlFilterValue(orderId);
  if (!id) return;
  navigateWithUrlFilters(navigate, ROUTES.ORDERS, { orderId: id });
}

/**
 * Opens lab workflow tab filtered by sample id (collection tab by default).
 */
export function navigateToLabWithSample(
  navigate: NavigateFunction,
  sampleId: string | number,
  tab: LabTabId = 'collection'
): void {
  const id = normalizeUrlFilterValue(sampleId);
  if (!id) return;
  const n = Number(id);
  const search = Number.isFinite(n) ? displayId.sample(n) : id;
  const params = new URLSearchParams({ search });
  navigate(`${getLabTabPath(tab)}?${params.toString()}`);
}

export function navigateToLabWithOrder(
  navigate: NavigateFunction,
  orderId: string | number,
  tab: LabTabId = 'collection'
): void {
  const id = normalizeUrlFilterValue(orderId);
  if (!id) return;
  const n = Number(id);
  const search = Number.isFinite(n) ? displayId.order(n) : id;
  const params = new URLSearchParams({ search });
  navigate(`${getLabTabPath(tab)}?${params.toString()}`);
}

export function navigateToPatientsWithPatient(
  navigate: NavigateFunction,
  patientId: string | number
): void {
  const id = normalizeUrlFilterValue(patientId);
  if (!id) return;
  navigateWithUrlFilters(navigate, ROUTES.PATIENTS, { patientId: id });
}

export type EntityNavigateTarget = {
  targetPage: string;
  filterKey: UrlFilterKey;
  /** Optional lab tab when target is laboratory. */
  labTab?: LabTabId;
};

/**
 * Builds navigation handler for RecordId filtered navigation.
 */
export function createEntityFilterNavigateHandler(
  navigate: NavigateFunction,
  value: string | number,
  target: EntityNavigateTarget
): () => void {
  const id = normalizeUrlFilterValue(value);
  if (!id) return () => undefined;

  return () => {
    if (target.labTab) {
      if (target.filterKey === 'sampleId') {
        navigateToLabWithSample(navigate, id, target.labTab);
        return;
      }
      if (target.filterKey === 'orderId') {
        navigateToLabWithOrder(navigate, id, target.labTab);
        return;
      }
    }
    navigateWithUrlFilters(navigate, target.targetPage, { [target.filterKey]: id });
  };
}

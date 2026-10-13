/**
 * Navigation helpers for pages opened with entity URL filters.
 */

import type { NavigateFunction } from 'react-router-dom';
import { ROUTES } from '@/config';
import { getLabTabPath, type LabTabId } from '@/features/lab';
import {
  buildFilteredUrl,
  type UrlFilterKey,
  type UrlFilters,
  normalizeUrlFilterValue,
} from './filterCodec';

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
  const path = buildFilteredUrl(getLabTabPath(tab), { sampleId: id });
  navigate(path);
}

export function navigateToLabWithOrder(
  navigate: NavigateFunction,
  orderId: string | number,
  tab: LabTabId = 'collection'
): void {
  const id = normalizeUrlFilterValue(orderId);
  if (!id) return;
  const path = buildFilteredUrl(getLabTabPath(tab), { orderId: id });
  navigate(path);
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
 * Builds navigation handler for EntityId filtered navigation.
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

export { buildFilteredUrl };

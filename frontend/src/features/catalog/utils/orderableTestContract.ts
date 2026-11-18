/** Read orderable-tests.json wire fields from API `contract` (snake_case). */
import type { CatalogOrderableTestEntry } from '@/types';
import type { OrderableTest, OrderableTestSummary } from '@/types';
import { getCategoryLabel } from '../constants/catalogConfig';

export function getOrderableTestContract(
  test: OrderableTest | OrderableTestSummary
): CatalogOrderableTestEntry | undefined {
  const wire = test.contract;
  if (!wire || typeof wire !== 'object') return undefined;
  if (!('test_code' in wire) || typeof (wire as CatalogOrderableTestEntry).test_code !== 'string') {
    return undefined;
  }
  return wire as CatalogOrderableTestEntry;
}

/** Display category from contract `category` (clinical grouping), else filter slug label. */
export function getTestClinicalCategory(test: OrderableTest | OrderableTestSummary): string {
  const category = getOrderableTestContract(test)?.category?.trim();
  if (category) return category;
  return getCategoryLabel(test.category);
}

const ORDER_OBS_LABELS: Record<string, string> = {
  order: 'Order',
  observation: 'Observation',
  both: 'Order and observation',
};

export function getTestOrderObsLabel(test: OrderableTest | OrderableTestSummary): string | undefined {
  const raw = getOrderableTestContract(test)?.order_obs?.trim().toLowerCase();
  if (!raw) return undefined;
  return ORDER_OBS_LABELS[raw] ?? raw;
}

export function getTestDescription(test: OrderableTest): string | undefined {
  const desc = getOrderableTestContract(test)?.description?.trim();
  return desc || undefined;
}
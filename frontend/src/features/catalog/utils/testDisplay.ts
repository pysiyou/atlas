/** Catalog display helpers from API fields (no contract blob). */
import type { OrderableTest, OrderableTestSummary } from '@/types';
import { getCategoryLabel } from '../constants/catalogConfig';

const ORDER_OBS_LABELS: Record<string, string> = {
  order: 'Order',
  observation: 'Observation',
  both: 'Order and observation',
};

export function getTestClinicalCategory(test: OrderableTest | OrderableTestSummary): string {
  const label = test.categoryLabel?.trim();
  if (label) return label;
  return getCategoryLabel(test.category);
}

export function getTestOrderObsLabel(test: OrderableTest | OrderableTestSummary): string | undefined {
  const raw = test.orderObs?.trim().toLowerCase();
  if (!raw) return undefined;
  return ORDER_OBS_LABELS[raw] ?? raw;
}

export function getTestDescription(test: OrderableTest | OrderableTestSummary): string | undefined {
  const desc = test.description?.trim();
  return desc || undefined;
}
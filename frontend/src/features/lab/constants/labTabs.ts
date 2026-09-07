/**
 * Lab tab route identifiers and helpers for URL-based navigation.
 */

import { ROUTES } from '@/config';
import type { TestStatus } from '@/types/enums';

export const LAB_TAB_IDS = [
  'collection',
  'entry',
  'validation',
  'dashboard',
] as const;

export type LabTabId = (typeof LAB_TAB_IDS)[number];

export const LAB_TAB_LABELS: Record<LabTabId, string> = {
  collection: 'Sample Collection',
  entry: 'Result Entry',
  validation: 'Result Review',
  dashboard: 'Command Center',
};

export const DEFAULT_LAB_TAB: LabTabId = 'dashboard';

export function isLabTabId(value: string | undefined): value is LabTabId {
  return LAB_TAB_IDS.includes(value as LabTabId);
}

/** Build a deep-linkable lab tab path, e.g. /laboratory/validation */
export function getLabTabPath(tab: LabTabId): string {
  return `${ROUTES.LABORATORY}/${tab}`;
}

/** Build a lab queue URL with optional search pre-fill for cross-links. */
export function getLabQueueUrl(
  tab: LabTabId,
  options?: { search?: string }
): string {
  const path = getLabTabPath(tab);
  if (!options?.search) return path;
  const params = new URLSearchParams({ search: options.search });
  return `${path}?${params.toString()}`;
}

/** Map a test status to the appropriate lab workflow tab, if actionable. */
export function getLabTabForTestStatus(status: TestStatus): LabTabId | null {
  switch (status) {
    case 'pending':
      return 'collection';
    case 'sample-collected':
      return 'entry';
    case 'resulted':
      return 'validation';
    case 'escalated':
      return 'validation';
    default:
      return null;
  }
}

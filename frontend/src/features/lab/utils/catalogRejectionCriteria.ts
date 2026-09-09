/**
 * Union of catalog-defined rejection criteria for one or more tests.
 */
import type { Test } from '@/types';

function criterionLabel(item: string | { reason?: string; label?: string }): string {
  if (typeof item === 'string') return item;
  return item.reason ?? item.label ?? '';
}

export function getUnionRejectionCriteria(testCodes: string[], catalog: Test[]): string[] {
  const seen = new Set<string>();
  const criteria: string[] = [];
  for (const code of testCodes) {
    const items = catalog.find(t => t.code === code)?.rejectionCriteria ?? [];
    for (const item of items) {
      const label = criterionLabel(item as string | { reason?: string; label?: string });
      if (label && !seen.has(label)) {
        seen.add(label);
        criteria.push(label);
      }
    }
  }
  return criteria;
}

/** Format rejection criteria for display tables. */
export function formatRejectionCriteriaList(
  items?: Array<string | { reason?: string; label?: string; domain?: string }>
): string[] {
  if (!items?.length) return [];
  return items.map(item => criterionLabel(item));
}

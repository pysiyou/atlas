/**
 * Union of catalog-defined rejection criteria for one or more tests.
 */
import type { Test } from '@/types';

export function getUnionRejectionCriteria(testCodes: string[], catalog: Test[]): string[] {
  const seen = new Set<string>();
  const criteria: string[] = [];
  for (const code of testCodes) {
    const items = catalog.find(t => t.code === code)?.rejectionCriteria ?? [];
    for (const item of items) {
      if (!seen.has(item)) {
        seen.add(item);
        criteria.push(item);
      }
    }
  }
  return criteria;
}

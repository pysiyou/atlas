/** Lab search keys, result presence, collection lookup filters, and queue deep-links. */
import type { TestWithContext, OrderTest } from '@/types';
import { displayId } from '@/utils';
import type { TestStatus } from '@/types/enums';
import { getLabQueueUrl, getLabTabForTestStatus, type LabTabId } from '@/features/lab/constants/labConstants';

export function orderTestKey(orderTestId: number): string {
  return `test-${orderTestId}`;
}

/** True when the order test row has persisted result values on file. */
export function hasTestResults(test: TestWithContext): boolean {
  return Boolean(test.results && Object.keys(test.results).length > 0);
}

export function resolveCollectionStatusFilters<T extends string>(
  isSampleLookup: boolean,
  statusFilters: T[]
): T[] {
  if (!isSampleLookup) return ['pending' as T];
  const onlyQueueDefault =
    statusFilters.length === 1 && statusFilters[0] === 'pending';
  if (statusFilters.length === 0 || onlyQueueDefault) return [];
  return statusFilters;
}

/**
 * Returns a lab queue URL for an order test, or null if not in an actionable queue.
 */
export function getLabQueueUrlForTest(test: OrderTest, orderId: number): string | null {
  const tab = getLabTabForTestStatus(test.status as TestStatus);
  if (!tab) return null;

  const searchTerms = [displayId.order(orderId), test.testCode].filter(Boolean);
  return getLabQueueUrl(tab, { search: searchTerms.join(' ') });
}

export { getLabTabForTestStatus, getLabQueueUrl, type LabTabId };


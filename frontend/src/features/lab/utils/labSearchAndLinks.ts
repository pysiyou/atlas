/** Lab search keys, result presence, collection lookup filters, and queue deep-links. */
import type { TestWithContext, OrderTest } from '@/types';
import { displayId, buildFilteredUrl } from '@/utils';
import type { TestStatus } from '@/types/enums';
import { getLabQueueUrl, getLabTabForTestStatus, getLabTabPath, type LabTabId } from '../constants/labConstants';

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
 * Returns a lab queue URL for an order test with proper filter support.
 * Uses URL filters (testId, orderId, sampleId) for direct navigation to the test in the queue.
 */
export function getLabQueueUrlForTest(test: OrderTest, orderId: number): string | null {
  const tab = getLabTabForTestStatus(test.status as TestStatus);
  if (!tab) return null;

  // Use URL filters for direct test navigation
  if (test.id) {
    const filters: Record<string, string> = {
      testId: String(test.id),
      orderId: String(orderId)
    };
    
    // Include sampleId for collection tab to help narrow results
    if (test.sampleId && tab === 'collection') {
      filters.sampleId = String(test.sampleId);
    }
    
    return buildFilteredUrl(getLabTabPath(tab), filters);
  }

  // Fallback to search-based URL (for tests without IDs)
  const searchTerms = [displayId.order(orderId), test.testCode].filter(Boolean);
  return getLabQueueUrl(tab, { search: searchTerms.join(' ') });
}

/**
 * Build URL to lab queue filtered by sample ID.
 */
export function getLabQueueUrlForSample(sampleId: number | string, tab: LabTabId = 'collection'): string {
  return buildFilteredUrl(getLabTabPath(tab), { sampleId: String(sampleId) });
}

/**
 * Build URL to lab queue filtered by order ID.
 */
export function getLabQueueUrlForOrder(orderId: number | string, tab: LabTabId = 'collection'): string {
  return buildFilteredUrl(getLabTabPath(tab), { orderId: String(orderId) });
}

export { getLabTabForTestStatus, getLabQueueUrl, type LabTabId };


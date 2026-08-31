/**
 * Lab queue deep-link helpers for cross-navigation from order detail.
 */

import { displayId } from '@/utils';
import type { OrderTest } from '@/types';
import type { TestStatus } from '@/types/enums/test';
import { getLabQueueUrl, getLabTabForTestStatus, type LabTabId } from '@/features/lab/constants/labTabs';

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

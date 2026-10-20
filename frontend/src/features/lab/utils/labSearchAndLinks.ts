/** Lab search keys, result presence, collection lookup filters, and queue deep-links. */
import type { TestWithContext, OrderTest } from '@/types';
import { displayId, buildFilteredUrl, inclusiveDateRangeBounds, toIsoDateParam } from '@/utils';
import type { TestStatus } from '@/types/enums';
import type { UrlFilters } from '@/utils/filters';
import { getLabQueueUrl, getLabTabForTestStatus, getLabTabPath, type LabTabId } from '../constants/labConstants';

export function hasActiveEntityUrlFilters(urlFilters?: UrlFilters): boolean {
  if (!urlFilters) return false;
  return Boolean(urlFilters.patientId || urlFilters.orderId || urlFilters.sampleId || urlFilters.testId);
}

/**
 * Text to show in the lab queue search input when opened via entity URL filters.
 * Collection prefers sample id (SAMxxxx) because that is what users search by on that tab.
 */
export function getLabQueueSearchFromUrlFilters(
  urlFilters: UrlFilters | undefined,
  fallback = '',
  preferSampleId = false
): string {
  if (!urlFilters) return fallback;
  if (preferSampleId && urlFilters.sampleId) {
    return displayId.sample(Number(urlFilters.sampleId));
  }
  if (urlFilters.testId) return displayId.orderTest(Number(urlFilters.testId));
  if (urlFilters.sampleId) return displayId.sample(Number(urlFilters.sampleId));
  if (urlFilters.orderId) return displayId.order(Number(urlFilters.orderId));
  return fallback;
}

export function orderTestKey(orderTestId: number): string {
  return `test-${orderTestId}`;
}

/**
 * Map queue filter controls onto worklist query params.
 */
export function worklistServerFilters(options: {
  search?: string;
  dateRange: [Date, Date] | null;
  sampleTypeFilters: string[];
}): { search?: string; dateFrom?: string; dateTo?: string; sampleType?: string } {
  const bounds = inclusiveDateRangeBounds(options.dateRange);
  return {
    search: options.search?.trim() || undefined,
    dateFrom: bounds ? toIsoDateParam(bounds.start) : undefined,
    dateTo: bounds ? toIsoDateParam(bounds.end) : undefined,
    sampleType: options.sampleTypeFilters.length ? options.sampleTypeFilters.join(',') : undefined,
  };
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
export function getLabQueueUrlForTest(
  test: Pick<OrderTest, 'id' | 'status' | 'testCode'> & {
    sampleId?: number | null;
    lab?: { pipelineStage?: string | null } | null;
  },
  orderId: number
): string | null {
  const tab = getLabTabForTestStatus(test.status as TestStatus, test.lab?.pipelineStage);
  if (!tab) return null;

  if (tab === 'collection') {
    const filters: Record<string, string> = { orderId: String(orderId) };
    if (test.sampleId) {
      filters.sampleId = String(test.sampleId);
    } else if (test.id) {
      filters.testId = String(test.id);
    }
    return buildFilteredUrl(getLabTabPath(tab), filters);
  }

  // Entry / validation: target the order test row
  if (test.id) {
    return buildFilteredUrl(getLabTabPath(tab), {
      testId: String(test.id),
      orderId: String(orderId),
    });
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


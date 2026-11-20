/** Lab search keys, result presence, collection lookup filters, and queue deep-links. */
import type { Order, OrderTest } from '@/types';
import { walkToLiveOrderTest } from '@/features/orders/utils/orderTestLineage';
import { isTerminalTestStatus } from './queueDisplay';
import type { LabModalWorkItem } from '../types/labQueueChrome';
import {
  classifyClinicalSearch,
  displayId,
  formatOrderTestDisplay,
  inclusiveDateRangeBounds,
  parseOrderTestDisplaySearch,
  toIsoDateParam,
} from '@/utils';
import type { TestStatus } from '@/types/generated/enums';
import { getLabQueueUrl, getLabTabForTestStatus, type LabTabId } from '../constants/labConstants';

export interface LabQueueSearchableIds {
  orderTestId?: number | null;
  orderId?: string | null;
  sampleId?: string | null;
  originalSampleId?: string | null;
  recollectionSampleId?: string | null;
  patientId?: string | null;
  testCode?: string | null;
}

type LabQueueSearchIntent =
  | { kind: 'empty' }
  | { kind: 'filler'; orderId: string }
  | { kind: 'accession'; sampleId: string }
  | { kind: 'patientId'; patientId: string }
  | { kind: 'mnemonic'; testCode: string }
  | { kind: 'orderTest'; accession: string; testCode: string }
  | { kind: 'text'; term: string };

function parseLabQueueSearchIntent(query: string): LabQueueSearchIntent {
  const trimmed = query.trim();
  if (!trimmed) return { kind: 'empty' };

  const orderTest = parseOrderTestDisplaySearch(trimmed);
  if (orderTest) {
    return {
      kind: 'orderTest',
      accession: orderTest.accession,
      testCode: orderTest.testCode,
    };
  }

  const classified = classifyClinicalSearch(trimmed);
  if (classified === 'filler') return { kind: 'filler', orderId: trimmed.replace(/[\s-]/g, '') };
  if (classified === 'accession') return { kind: 'accession', sampleId: trimmed };
  if (classified === 'patientId') {
    return { kind: 'patientId', patientId: trimmed.replace(/[\s-]/g, '').toUpperCase() };
  }
  if (classified === 'mnemonic') return { kind: 'mnemonic', testCode: trimmed.toUpperCase() };
  return { kind: 'text', term: trimmed };
}

/** Build searchable tokens from clinical identifiers. */
export function labQueueSearchTextFields(
  ids: LabQueueSearchableIds,
  extra: string[] = [],
): string[] {
  const fields = [
    ids.orderId ?? '',
    ids.sampleId ?? '',
    ids.patientId ?? '',
    ids.testCode ?? '',
    ids.sampleId && ids.testCode
      ? formatOrderTestDisplay(ids.sampleId, ids.testCode)
      : '',
    ...extra,
  ].filter(Boolean);
  return fields;
}

/** Client-side lab queue search: filler/accession/patient ID/mnemonic or free text. */
export function matchLabQueueSearchQuery(
  ids: LabQueueSearchableIds,
  textFields: string[],
  query: string,
): boolean {
  const intent = parseLabQueueSearchIntent(query);
  if (intent.kind === 'empty') return true;
  if (intent.kind === 'filler') {
    return Boolean(ids.orderId && ids.orderId === intent.orderId);
  }
  if (intent.kind === 'accession') {
    return Boolean(
      (ids.sampleId && ids.sampleId === intent.sampleId) ||
        (ids.originalSampleId && ids.originalSampleId === intent.sampleId) ||
        (ids.recollectionSampleId && ids.recollectionSampleId === intent.sampleId)
    );
  }
  if (intent.kind === 'patientId') {
    return Boolean(ids.patientId && ids.patientId === intent.patientId);
  }
  if (intent.kind === 'mnemonic') {
    return Boolean(ids.testCode && ids.testCode.toUpperCase() === intent.testCode);
  }
  if (intent.kind === 'orderTest') {
    const sampleMatch = Boolean(ids.sampleId && ids.sampleId === intent.accession);
    if (!sampleMatch) return false;
    if (ids.testCode) {
      return ids.testCode.toUpperCase() === intent.testCode;
    }
    return textFields.some(field => field.toUpperCase() === intent.testCode);
  }
  const lower = intent.term.toLowerCase();
  return textFields.some(field => field.toLowerCase().includes(lower));
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
  priority?: string[];
  priorityGroup?: string[];
  category?: string;
}): {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sampleType?: string;
  priority?: string;
  priorityGroup?: string;
  category?: string;
} {
  const bounds = inclusiveDateRangeBounds(options.dateRange);
  const groups = options.priorityGroup?.filter(item => item === 'stat' || item === 'routine') ?? [];
  return {
    search: options.search?.trim() || undefined,
    dateFrom: bounds ? toIsoDateParam(bounds.start) : undefined,
    dateTo: bounds ? toIsoDateParam(bounds.end) : undefined,
    sampleType: options.sampleTypeFilters.length ? options.sampleTypeFilters.join(',') : undefined,
    priority: options.priority?.length ? options.priority.join(',') : undefined,
    priorityGroup: groups.length === 1 ? groups[0] : undefined,
    category: options.category?.trim() || undefined,
  };
}

/** True when the work item has persisted result values on file. */
export function hasResultsOnWorkItem(
  workItem: Pick<LabModalWorkItem, 'results'>
): boolean {
  return Boolean(workItem.results && Object.keys(workItem.results).length > 0);
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
 * One clinical search token for deep-linking to a lab queue from an order test.
 * Prefer accession (sample is the lab work item); else mnemonic; else order filler.
 */
export function labQueueSearchTermForTest(
  test: Pick<OrderTest, 'testCode'> & { sampleId?: string | null },
  orderId: string,
  liveSampleId?: string | null,
): string | undefined {
  const accession = (liveSampleId ?? test.sampleId)?.trim();
  if (accession) return accession;
  const mnemonic = test.testCode?.trim().toUpperCase();
  if (mnemonic) return mnemonic;
  const filler = displayId.order(orderId);
  return filler !== '-' ? filler : undefined;
}

/**
 * Lab queue URL for an order test: workflow tab + single token in `search`.
 */
export function getLabQueueUrlForTest(
  test: Pick<OrderTest, 'id' | 'status' | 'testCode'> & {
    sampleId?: string | null;
    lab?: { pipelineStage?: string | null } | null;
  },
  orderId: string,
  order?: Pick<Order, 'tests'>,
): string | null {
  const live =
    order?.tests && test.id != null
      ? walkToLiveOrderTest(order.tests, test as OrderTest)
      : test;
  const tab = getLabTabForTestStatus(live.status as TestStatus, live.lab?.pipelineStage);
  if (!tab) return null;

  const search = labQueueSearchTermForTest(live, orderId, live.sampleId);
  if (!search) return getLabQueueUrl(tab);
  return getLabQueueUrl(tab, { search });
}

export function filterLiveOrderTestQueueRows<
  T extends {
    orderTestId: number;
    status: string;
    retestOfTestId?: number | null;
    retestOrderTestId?: number | null;
  },
>(rows: T[]): T[] {
  const hiddenIds = new Set<number>();
  for (const row of rows) {
    if (row.retestOfTestId != null) hiddenIds.add(row.retestOfTestId);
    if (row.retestOrderTestId != null) hiddenIds.add(row.orderTestId);
  }
  return rows.filter(
    row => !isTerminalTestStatus(row.status) && !hiddenIds.has(row.orderTestId)
  );
}

/** Lab queue URL with accession in the search bar. */
export function getLabQueueUrlForSample(
  sampleId: string,
  tab: LabTabId = 'collection',
): string {
  return getLabQueueUrl(tab, { search: sampleId.trim() });
}

/** Lab queue URL with filler number in the search bar. */
export function getLabQueueUrlForOrder(
  orderId: string,
  tab: LabTabId = 'collection',
): string {
  return getLabQueueUrl(tab, { search: orderId.trim() });
}

export { getLabTabForTestStatus, getLabQueueUrl, type LabTabId };

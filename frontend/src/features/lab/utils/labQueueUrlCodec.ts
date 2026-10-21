/**
 * Encode/decode lab queue FilterBar params in the URL (separate from entity filters).
 */

import { parseISO, isValid, startOfDay, endOfDay } from 'date-fns';
import { toIsoDateParam } from '@/utils';
import type { LabQueueWorkflowType } from './labQueueStageFilterConfig';

/** Query keys owned by the lab queue filter bar (not entity deep-links). */
export const LAB_QUEUE_BAR_URL_KEYS = [
  'search',
  'dateFrom',
  'dateTo',
  'sampleType',
  'status',
  'priority',
] as const;

export type LabQueueBarUrlKey = (typeof LAB_QUEUE_BAR_URL_KEYS)[number];

export interface LabQueueBarFilters {
  searchQuery: string;
  dateRange: [Date, Date] | null;
  sampleTypeFilters: string[];
  /** Status (collection/entry) or priority (validation) multi-select values. */
  statusFilters: string[];
}

function parseIsoDateRange(dateFrom: string | null, dateTo: string | null): [Date, Date] | null {
  if (!dateFrom || !dateTo) return null;
  const start = parseISO(dateFrom);
  const end = parseISO(dateTo);
  if (!isValid(start) || !isValid(end)) return null;
  return [startOfDay(start), endOfDay(end)];
}

function parseCsvParam(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
}

function statusUrlKey(workflowType: LabQueueWorkflowType): 'status' | 'priority' {
  return workflowType === 'validationReview' ? 'priority' : 'status';
}

/**
 * Read filter-bar state from the current query string.
 */
export function decodeLabQueueBarFilters(
  searchParams: URLSearchParams,
  workflowType: LabQueueWorkflowType,
  defaultStatusFilters: readonly string[],
): LabQueueBarFilters {
  const searchQuery = searchParams.get('search') ?? '';
  const dateRange = parseIsoDateRange(
    searchParams.get('dateFrom'),
    searchParams.get('dateTo'),
  );
  const sampleTypeFilters = parseCsvParam(searchParams.get('sampleType'));
  const statusKey = statusUrlKey(workflowType);
  const rawStatus = searchParams.get(statusKey);
  const statusFilters =
    rawStatus === null ? [...defaultStatusFilters] : parseCsvParam(rawStatus);

  return {
    searchQuery,
    dateRange,
    sampleTypeFilters,
    statusFilters,
  };
}

/**
 * Writes filter-bar params into URLSearchParams (clears prior bar keys first).
 */
export function writeLabQueueBarFilters(
  params: URLSearchParams,
  filters: LabQueueBarFilters,
  workflowType: LabQueueWorkflowType,
): void {
  for (const key of LAB_QUEUE_BAR_URL_KEYS) {
    params.delete(key);
  }

  const trimmedSearch = filters.searchQuery.trim();
  if (trimmedSearch) {
    params.set('search', trimmedSearch);
  }

  if (filters.dateRange) {
    const from = filters.dateRange[0];
    const to = filters.dateRange[1];
    if (isValid(from) && isValid(to)) {
      params.set('dateFrom', toIsoDateParam(from));
      params.set('dateTo', toIsoDateParam(to));
    }
  }

  if (filters.sampleTypeFilters.length > 0) {
    params.set('sampleType', filters.sampleTypeFilters.join(','));
  }

  const statusKey = statusUrlKey(workflowType);
  if (filters.statusFilters.length > 0) {
    params.set(statusKey, filters.statusFilters.join(','));
  }
}

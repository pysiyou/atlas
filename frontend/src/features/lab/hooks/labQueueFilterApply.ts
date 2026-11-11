/**
 * Pure lab-queue client filter apply (no URL/React state).
 */

import type { PriorityLevel, SampleStatus, TestStatus } from '@/types';
import { isDateInInclusiveRange } from '@/utils';
import { compareQueuePriority } from '../utils/queueDisplay';
import type { LabQueueSecondaryFilterProfile } from '../utils/labQueueSecondaryProfiles';

export interface LabQueueFilterState<S> {
  searchQuery: string;
  dateRange: [Date, Date] | null;
  sampleTypeFilters: string[];
  statusFilters: S[];
}

/** Skip flags from the URL bar when applying client-side filters. */
export interface LabQueueClientSkipFlags {
  skipSearchFilter: boolean;
  skipDateFilter: boolean;
  skipSampleTypeFilter: boolean;
}

export type LabQueueClientStatus = SampleStatus | TestStatus | PriorityLevel;

function applyDateRange<T>(
  out: T[],
  dateRange: [Date, Date] | null,
  getOrderDate: (item: T) => string | undefined
): T[] {
  if (!dateRange) return out;
  return out.filter(item => isDateInInclusiveRange(getOrderDate(item), dateRange));
}

/** Apply the same lab queue filters used by workflow views (search, date, sample type, priority). */
export function applyLabQueueFilters<T, S>({
  items,
  filters,
  getOrderDate,
  getSampleType,
  getStatus,
  searchFilterFn,
  sortByQueuePriority = false,
  getPriority,
  getQueueSince,
  applyStatusFilter = true,
  skipSearchFilter = false,
  skipDateFilter = false,
  skipSampleTypeFilter = false,
}: {
  items: T[];
  filters: LabQueueFilterState<S>;
  getOrderDate: (item: T) => string | undefined;
  getSampleType: (item: T) => string | undefined;
  getStatus: (item: T) => S | undefined;
  searchFilterFn: (item: T, query: string) => boolean;
  sortByQueuePriority?: boolean;
  getPriority?: (item: T) => string | undefined;
  getQueueSince?: (item: T) => string | undefined;
  applyStatusFilter?: boolean;
  skipSearchFilter?: boolean;
  skipDateFilter?: boolean;
  skipSampleTypeFilter?: boolean;
}): T[] {
  let out = items;

  if (!skipDateFilter) {
    out = applyDateRange(out, filters.dateRange, getOrderDate);
  }
  if (!skipSampleTypeFilter && filters.sampleTypeFilters.length > 0) {
    out = out.filter(item => {
      const st = getSampleType(item);
      return st && filters.sampleTypeFilters.includes(st);
    });
  }
  if (applyStatusFilter && filters.statusFilters.length > 0) {
    out = out.filter(item => {
      const s = getStatus(item);
      return s != null && filters.statusFilters.includes(s);
    });
  }
  if (!skipSearchFilter && filters.searchQuery.trim()) {
    out = out.filter(item => searchFilterFn(item, filters.searchQuery));
  }
  if (sortByQueuePriority && getPriority && getQueueSince) {
    out = [...out].sort((a, b) =>
      compareQueuePriority(getPriority(a), getPriority(b), getQueueSince(a), getQueueSince(b))
    );
  }
  return out;
}

/** Apply the active bar + shared filterState to a secondary validation list. */
export function applyLabQueueFiltersWithProfile<T, S extends LabQueueClientStatus>(
  items: T[],
  filterState: LabQueueFilterState<LabQueueClientStatus>,
  bar: LabQueueClientSkipFlags,
  profile: LabQueueSecondaryFilterProfile<T, S>,
): T[] {
  const { callbacks, sortByPriority, applyStatusFilter = true } = profile;
  return applyLabQueueFilters<T, S>({
    items,
    filters: filterState as LabQueueFilterState<S>,
    getOrderDate: callbacks.getOrderDate,
    getSampleType: callbacks.getSampleType,
    getStatus: callbacks.getStatus,
    searchFilterFn: callbacks.searchFilterFn,
    sortByQueuePriority: sortByPriority,
    getPriority: callbacks.getPriority,
    getQueueSince: callbacks.getQueueSince,
    applyStatusFilter,
    skipSearchFilter: bar.skipSearchFilter,
    skipDateFilter: bar.skipDateFilter,
    skipSampleTypeFilter: bar.skipSampleTypeFilter,
  });
}

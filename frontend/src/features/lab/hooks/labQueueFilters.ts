/**
 * Lab queue filters — page wiring.
 * Codec: `utils/labQueueUrlCodec`. Apply: `labQueueFilterApply`. Bar state: `useLabQueueBarFilters`.
 *
 * Worklist tabs use a two-step pattern (avoids a worklist ↔ items cycle):
 * 1. `useLabQueueBarFilters(workflowType)` → `serverFilters` for the worklist API
 * 2. After items load → `useLabQueuePageFilters({ items, workflowType, bar })`
 */

import { useMemo } from 'react';
import { resolveCollectionStatusFilters } from '../utils/labSearchAndLinks';
import {
  getLabQueueStageConfig,
  type LabQueueItemByStage,
  type LabQueueWorkflowType,
} from '../utils/labQueueStageFilterConfig';
import {
  applyLabQueueFilters,
  type LabQueueClientStatus,
  type LabQueueFilterState,
} from './labQueueFilterApply';
import { type LabQueueBarState } from './useLabQueueBarFilters';

export {
  applyLabQueueFilters,
  applyLabQueueFiltersWithProfile,
  type LabQueueFilterState,
  type LabQueueClientStatus,
} from './labQueueFilterApply';
export { useLabQueueBarFilters, type LabQueueBarState } from './useLabQueueBarFilters';

function useLabQueueFilteredItems<T extends LabQueueWorkflowType>(
  items: LabQueueItemByStage<T>[],
  bar: LabQueueBarState,
  workflowType: T,
): { filteredItems: LabQueueItemByStage<T>[]; filterState: LabQueueFilterState<LabQueueClientStatus> } {
  const filterConfig = useMemo(() => getLabQueueStageConfig(workflowType), [workflowType]);

  const filterState = useMemo<LabQueueFilterState<LabQueueClientStatus>>(
    () => ({
      searchQuery: bar.searchQuery,
      dateRange: bar.dateRange,
      sampleTypeFilters: bar.sampleTypeFilters,
      statusFilters: bar.statusFilters as LabQueueClientStatus[],
    }),
    [bar],
  );

  const filtersForApply = useMemo((): LabQueueFilterState<LabQueueClientStatus> => {
    const resolvedStatus: LabQueueClientStatus[] = bar.collectionSampleLookup
      ? (resolveCollectionStatusFilters(true, filterState.statusFilters as string[]) as LabQueueClientStatus[])
      : filterState.statusFilters;

    return {
      ...filterState,
      statusFilters: resolvedStatus,
    };
  }, [filterState, bar.collectionSampleLookup]);

  const filteredItems = useMemo(
    () =>
      applyLabQueueFilters<LabQueueItemByStage<T>, LabQueueClientStatus>({
        items,
        filters: filtersForApply,
        getOrderDate: filterConfig.callbacks.getOrderDate as (item: LabQueueItemByStage<T>) => string | undefined,
        getSampleType: filterConfig.callbacks.getSampleType as (item: LabQueueItemByStage<T>) => string | undefined,
        getStatus: filterConfig.callbacks.getStatus as (item: LabQueueItemByStage<T>) => LabQueueClientStatus | undefined,
        searchFilterFn: filterConfig.callbacks.searchFilterFn as (
          item: LabQueueItemByStage<T>,
          query: string,
        ) => boolean,
        sortByQueuePriority: filterConfig.sortByPriority,
        getPriority: filterConfig.callbacks.getPriority as (item: LabQueueItemByStage<T>) => string | undefined,
        getQueueSince: filterConfig.callbacks.getQueueSince as (item: LabQueueItemByStage<T>) => string | undefined,
        applyStatusFilter: true,
        skipSearchFilter: bar.skipSearchFilter,
        skipDateFilter: bar.skipDateFilter,
        skipSampleTypeFilter: bar.skipSampleTypeFilter,
      }),
    [items, filtersForApply, filterConfig, bar],
  );

  return { filteredItems, filterState };
}

export interface LabQueueFilterBarPropsOptions {
  statusFilterKey?: 'status' | 'priority';
}

/** Props for {@link LabQueueFilters} from {@link useLabQueueBarFilters} state. */
export function useLabQueueFilterBarProps(
  bar: LabQueueBarState,
  options?: LabQueueFilterBarPropsOptions,
) {
  const statusFilterKey = options?.statusFilterKey ?? 'status';
  return useMemo(
    () => ({
      searchQuery: bar.searchQuery,
      onSearchChange: bar.setSearchQuery,
      dateRange: bar.dateRange,
      onDateRangeChange: bar.setDateRange,
      sampleTypeFilters: bar.sampleTypeFilters,
      onSampleTypeFiltersChange: bar.setSampleTypeFilters,
      statusFilters: bar.statusFilters,
      onStatusFiltersChange: bar.setStatusFilters,
      statusFilterKey,
    }),
    [bar, statusFilterKey],
  );
}

export interface UseLabQueuePageFiltersOptions<T extends LabQueueWorkflowType> {
  items: LabQueueItemByStage<T>[];
  workflowType: T;
  bar: LabQueueBarState;
}

export function useLabQueuePageFilters<T extends LabQueueWorkflowType>({
  items,
  workflowType,
  bar,
}: UseLabQueuePageFiltersOptions<T>) {
  const { filteredItems, filterState } = useLabQueueFilteredItems(items, bar, workflowType);

  return {
    ...bar,
    filteredItems,
    filterState,
  };
}

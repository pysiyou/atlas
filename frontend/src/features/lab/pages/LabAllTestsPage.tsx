/**
 * All order tests — server-paginated registry sorted by last modified.
 */
import React, { useCallback, useMemo } from 'react';
import { EMPTY_COPY } from '@/config/emptyStateCopy';
import { ListView } from '@/components/surfaces';
import { EmptyState } from '@/components/display';
import { PANEL_EMPTY_STATE } from '@/components/display';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import { FeatureFilterBar, usePageFilters, useServerListChrome } from '@/hooks';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import type { PriorityLevel, TestStatus } from '@/types';
import { inclusiveDateRangeBounds, toIsoDateParam } from '@/utils';
import { getOrderTestLineageRowClass } from '@/features/orders';
import { cn } from '@/utils';
import { SPLIT_ROW_INTERACTIVE } from '@/theme/recipes';
import { LAB_CONFIG, LAB_COPY } from '../constants/labConstants';
import { allTestsFilterConfig } from '../constants/labFilterConfigs';
import { useAllTestsWorklist, WORKLIST_PAGE_SIZE } from '../api/worklists';
import { createLabOrdersTableConfig } from '../monitor/LabOrdersTable.config';
import { mapDashboardWorklistRow } from '../monitor/labOrderTableRow';
import type { LabOrderTableRow } from '../monitor/LabOrdersTable.types';

export const LabAllTestsPage: React.FC = () => {
  const { openModal } = useModal();

  const { filters, setFilter } = usePageFilters({
    initialFilters: {
      searchQuery: '',
      dateRange: null,
      sampleType: [] as string[],
      status: [] as TestStatus[],
      priority: [] as PriorityLevel[],
    },
  });

  const searchQuery = (filters.searchQuery as string) ?? '';
  const dateRange = (filters.dateRange as [Date, Date] | null) ?? null;
  const sampleTypeFilters = (filters.sampleType as string[]) ?? [];
  const statusFilters = (filters.status as TestStatus[]) ?? [];
  const priorityFilters = (filters.priority as PriorityLevel[]) ?? [];

  const debouncedSearch = useDebouncedValue(searchQuery, LAB_CONFIG.SEARCH_DEBOUNCE_MS);

  const serverFilters = useMemo(() => {
    const bounds = inclusiveDateRangeBounds(dateRange);
    return {
      search: debouncedSearch.trim() || undefined,
      dateFrom: bounds ? toIsoDateParam(bounds.start) : undefined,
      dateTo: bounds ? toIsoDateParam(bounds.end) : undefined,
      sampleType: sampleTypeFilters.length ? sampleTypeFilters.join(',') : undefined,
      status: statusFilters.length ? statusFilters.join(',') : undefined,
      priority: priorityFilters.length ? priorityFilters.join(',') : undefined,
    };
  }, [debouncedSearch, dateRange, sampleTypeFilters, statusFilters, priorityFilters]);

  const {
    items,
    pagination,
    isLoading,
    isError,
    error: queryError,
    refetch,
    page,
    goToPage,
  } = useAllTestsWorklist({
    ...serverFilters,
    pageSize: WORKLIST_PAGE_SIZE,
  });

  const resetPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const { loading, error, listPagination, setFilterAndReset, onRetry } = useServerListChrome({
    setFilter,
    resetPage,
    loadFailedKey: 'lab.worklist.loadFailed',
    isLoading,
    isError,
    error: queryError,
    refetch,
    page,
    pagination: pagination ?? { pageSize: WORKLIST_PAGE_SIZE, total: 0 },
    goToPage,
    pageSizeOptions: [DEFAULT_LIST_PAGE_SIZE, WORKLIST_PAGE_SIZE],
  });

  const rows = useMemo(() => items.map(mapDashboardWorklistRow), [items]);

  const viewConfig = useMemo(
    () => createLabOrdersTableConfig({ dateColumnLabel: 'Last modified' }),
    [],
  );

  const handleRowClick = useCallback(
    (row: LabOrderTableRow) => {
      openModal({
        type: ModalType.TEST_DETAIL,
        orderTestId: row.orderTestId,
        interaction: 'view',
      });
    },
    [openModal],
  );

  const filterValue = useMemo(
    () => ({
      searchQuery,
      dateRange,
      sampleType: sampleTypeFilters,
      status: statusFilters,
      priority: priorityFilters,
    }),
    [searchQuery, dateRange, sampleTypeFilters, statusFilters, priorityFilters],
  );

  const filterHandlers = useMemo(
    () => ({
      searchQuery: (value: string) => setFilterAndReset('searchQuery', value),
      dateRange: (value: [Date, Date] | null) => setFilterAndReset('dateRange', value),
      sampleType: (value: string[]) => setFilterAndReset('sampleType', value),
      status: (value: TestStatus[]) => setFilterAndReset('status', value),
      priority: (value: PriorityLevel[]) => setFilterAndReset('priority', value),
    }),
    [setFilterAndReset],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ListView
        items={rows}
        viewConfig={viewConfig}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onDismissError={() => undefined}
        onRowClick={handleRowClick}
        title={LAB_COPY.workflow.allTestsPageTitle}
        subtitle={LAB_COPY.workflow.allTestsPageSubtitle}
        filters={
          <FeatureFilterBar
            config={allTestsFilterConfig}
            value={filterValue}
            handlers={filterHandlers}
          />
        }
        pagination={listPagination}
        rowClassName={row =>
          cn(SPLIT_ROW_INTERACTIVE, getOrderTestLineageRowClass({ status: row.status }))
        }
        emptyState={
          <EmptyState
            {...PANEL_EMPTY_STATE}
            title={EMPTY_COPY.allTestsWorklist.title}
            description={EMPTY_COPY.allTestsWorklist.description}
            variant="dense"
          />
        }
        ariaLabel="All lab order tests"
      />
    </div>
  );
};

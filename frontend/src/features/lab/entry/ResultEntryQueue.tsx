/**
 * ResultEntryQueue - Main view for result entry workflow
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { uniqueSortedTestCodes, useTestsByCodes } from '@/features/catalog';
import { useLabQueueFilters } from '../hooks';
import type { TestWithContextResult } from '../types';
import { useEntryWorklist } from '../api/worklists';
import { mapEntryWorklistToOrderTestContext } from '../utils/labQueue';
import { LabWorkflowQueueLayout } from '../components/LabWorkflowQueueLayout';
import { LabQueueFilters } from '../components/LabQueueFilters';
import { LabQueueFilterRow } from '../components/LabQueueFilterRow';
import { entryFilterConfig, LAB_CONFIG } from '../constants';
import { EMPTY_COPY } from '@/components/display';
import { ErrorAlert, ErrorBoundary } from '@/components/loaders';
import { DetailPageSkeleton } from '@/components/loaders/DetailPageSkeleton';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useResultEntryWorkflow } from './useResultEntryWorkflow';
import { useLabDraftStore } from '../state/labDraftStore';
import { ResultEntryQueueItem } from './ResultEntryQueueCards';
import { worklistServerFilters } from '../utils/labSearchAndLinks';
import { errorAlertMessage } from '@/utils/feedback';

/** Stable empty map so unedited cards keep the same `results` identity. */
const EMPTY_RESULT_VALUES: Record<string, string> = {};

export const ResultEntryQueue: React.FC = () => {
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [sampleTypeFilters, setSampleTypeFilters] = useState<string[]>([]);
  const debouncedSearch = useDebouncedValue(searchQuery, LAB_CONFIG.SEARCH_DEBOUNCE_MS);
  const serverFilters = worklistServerFilters({
    search: debouncedSearch,
    dateRange,
    sampleTypeFilters,
  });
  const {
    items: worklistItems,
    pagination,
    isLoading: worklistLoading,
    isError: worklistError,
    error: worklistQueryError,
    refetch: refetchWorklist,
    goToPage,
  } = useEntryWorklist(serverFilters);

  const allTests = useMemo(
    () => worklistItems.map(mapEntryWorklistToOrderTestContext) as TestWithContextResult[],
    [worklistItems]
  );
  const uniqueCodes = useMemo(
    () => uniqueSortedTestCodes(allTests.map(test => test.testCode)),
    [allTests]
  );
  const { byCode: fullByCode, isLoading: catalogLoading } = useTestsByCodes(uniqueCodes);

  const {
    entryDrafts,
    handleResultChange,
    handleNotesChange,
    areAllParametersFilled,
    handleSaveResults,
    openTestModal,
  } = useResultEntryWorkflow({ allTests, fullByCode });

  useEffect(() => {
    const ids = allTests
      .map(test => test.id)
      .filter((id): id is number => typeof id === 'number');
    useLabDraftStore.getState().retainEntryDrafts(ids);
  }, [allTests]);

  const {
    filteredItems: filteredTests,
    statusFilters,
    setStatusFilters,
    urlFilters,
    clearUrlFilters,
    setUrlFilter,
  } = useLabQueueFilters({
    items: allTests,
    workflowType: 'entry',
    searchQuery,
    onSearchChange: setSearchQuery,
    dateRange,
    onDateRangeChange: setDateRange,
    sampleTypeFilters,
    onSampleTypeFiltersChange: setSampleTypeFilters,
    skipSearchFilter: true,
    skipDateFilter: true,
    skipSampleTypeFilter: true,
  });

  const handleSaveTest = useCallback(
    (test: TestWithContextResult) => {
      if (test.id == null) return;
      void handleSaveResults(test.id, test.orderId, allTests, fullByCode);
    },
    [handleSaveResults, allTests, fullByCode]
  );

  const handleOpenTest = useCallback(
    (test: TestWithContextResult) => {
      openTestModal(test);
    },
    [openTestModal]
  );

  const hasNoItems = allTests.length === 0;
  const waitingOnCatalog =
    uniqueCodes.length > 0 && catalogLoading && fullByCode.size === 0;
  if ((worklistLoading && hasNoItems) || waitingOnCatalog) {
    return (
      <ErrorBoundary>
        <DetailPageSkeleton variant="workflow-grid" />
      </ErrorBoundary>
    );
  }

  if (worklistError) {
    return (
      <ErrorBoundary>
        <ErrorAlert
          error={{ message: errorAlertMessage('lab.worklist.loadFailed', worklistQueryError) }}
          onRetry={() => {
            void refetchWorklist();
          }}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <LabWorkflowQueueLayout
        items={filteredTests}
        renderCard={(test, idx) => {
          const testItem = test as TestWithContextResult;
          if (testItem.id == null) return null;
          const testDef = fullByCode.get(testItem.testCode);
          const isComplete = testDef?.parameters
            ? areAllParametersFilled(testItem.id, testDef.parameters.length)
            : false;
          const draft = entryDrafts[testItem.id];
          return (
            <ResultEntryQueueItem
              test={testItem}
              idx={idx}
              testDef={testDef}
              results={draft?.results ?? EMPTY_RESULT_VALUES}
              technicianNotes={draft?.technicianNotes ?? ''}
              isComplete={isComplete}
              isMobile={isMobile}
              onResultsChange={(_key, paramCode, value) =>
                handleResultChange(testItem.id!, paramCode, value)
              }
              onNotesChange={(_key, notes) => handleNotesChange(testItem.id!, notes)}
              onSaveTest={handleSaveTest}
              onOpenTest={handleOpenTest}
            />
          );
        }}
        getItemKey={(test, idx) =>
          (test as TestWithContextResult).id != null
            ? `entry-${(test as TestWithContextResult).id}-${idx}`
            : `entry-${idx}`
        }
        emptyTitle={EMPTY_COPY.pendingResults.title}
        emptyDescription={EMPTY_COPY.pendingResults.description}
        filterRow={
          <LabQueueFilterRow
            urlFilters={urlFilters}
            onClearUrlFilters={clearUrlFilters}
            onClearUrlFilter={key => setUrlFilter(key, undefined)}
            pagination={pagination}
            onPageChange={goToPage}
          >
            <LabQueueFilters
              config={entryFilterConfig}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              sampleTypeFilters={sampleTypeFilters}
              onSampleTypeFiltersChange={setSampleTypeFilters}
              statusFilters={statusFilters}
              onStatusFiltersChange={setStatusFilters}
            />
          </LabQueueFilterRow>
        }
      />
    </ErrorBoundary>
  );
};

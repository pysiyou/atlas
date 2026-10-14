/**
 * ResultEntryQueue - Main view for result entry workflow
 */

import React, { useCallback, useMemo } from 'react';
import { useTestCatalog, useTestNameLookup } from '@/features/catalog';
import { useLabQueueFilters } from '../hooks';
import type { TestWithContextResult } from '../types';
import { useEntryWorklist } from '../api/worklists';
import { mapEntryWorklistToOrderTestContext } from '../utils/labQueue';
import { LabWorkflowQueueLayout } from '../components/LabWorkflowQueueLayout';
import { LabQueueFilters } from '../components/LabQueueFilters';
import { LabQueueFilterRow } from '../components/LabQueueFilterRow';
import { entryFilterConfig } from '../constants';
import { EMPTY_COPY } from '@/components/display';
import { ErrorBoundary } from '@/components/loaders';
import { DetailPageSkeleton } from '@/components/loaders/DetailPageSkeleton';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { useResultEntryWorkflow } from './useResultEntryWorkflow';
import { orderTestKey } from '../utils/labSearchAndLinks';
import { ResultEntryQueueItem } from './ResultEntryQueueCards';

/** Stable empty map so unedited cards keep the same `results` identity. */
const EMPTY_RESULT_VALUES: Record<string, string> = {};

export const ResultEntryQueue: React.FC = () => {
  const { getTest } = useTestNameLookup();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');

  const { items: worklistItems, pagination, isLoading: worklistLoading } = useEntryWorklist();
  const { tests: testCatalog } = useTestCatalog();

  const allTests = useMemo(
    () => worklistItems.map(mapEntryWorklistToOrderTestContext) as TestWithContextResult[],
    [worklistItems]
  );

  const {
    results,
    technicianNotes,
    handleResultChange,
    handleNotesChange,
    areAllParametersFilled,
    handleSaveResults,
    openTestModal,
  } = useResultEntryWorkflow({ allTests, testCatalog });

  const {
    filteredItems: filteredTests,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    sampleTypeFilters,
    setSampleTypeFilters,
    statusFilters,
    setStatusFilters,
    urlFilters,
    clearUrlFilters,
    setUrlFilter,
  } = useLabQueueFilters({
    items: allTests,
    workflowType: 'entry',
  });

  const handleSaveTest = useCallback(
    (test: TestWithContextResult) => {
      if (test.id == null) return;
      void handleSaveResults(test.id, test.orderId, allTests, testCatalog);
    },
    [handleSaveResults, allTests, testCatalog]
  );

  const handleOpenTest = useCallback(
    (test: TestWithContextResult) => {
      openTestModal(test);
    },
    [openTestModal]
  );

  const hasNoItems = allTests.length === 0;
  if ((worklistLoading && hasNoItems) || !testCatalog) {
    return (
      <ErrorBoundary>
        <DetailPageSkeleton variant="workflow-grid" />
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
          const testDef = getTest(testItem.testCode);
          const resultKey = orderTestKey(testItem.id);
          const isComplete = testDef?.parameters
            ? areAllParametersFilled(resultKey, testDef.parameters.length)
            : false;
          return (
            <ResultEntryQueueItem
              test={testItem}
              idx={idx}
              testDef={testDef}
              results={results[resultKey] ?? EMPTY_RESULT_VALUES}
              technicianNotes={technicianNotes[resultKey] ?? ''}
              isComplete={isComplete}
              isMobile={isMobile}
              onResultsChange={handleResultChange}
              onNotesChange={handleNotesChange}
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

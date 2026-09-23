/**
 * ResultEntryQueue - Main view for result entry workflow
 */

import React, { useMemo } from 'react';
import { useTestNameLookup } from '@/features/catalog';
import { useResultEntryQueueData, useLabQueueFilters } from '../hooks';
import type { TestWithContextResult } from '../hooks/useOrderTestsWithLabContext';
import { useEntryWorklist } from '../api/worklists';
import { mapEntryWorklistToOrderTestContext } from '../utils/labQueue';
import { ResultEntryCard } from './ResultEntryCard';
import { LabWorkflowQueueLayout } from '../components/LabWorkflowQueueLayout';
import { LabQueueFilters } from '../components/LabQueueFilters';
import { entryFilterConfig } from '../constants';
import { EMPTY_COPY, ErrorBoundary } from '@/components';
import { DetailPageSkeleton } from '@/components/loaders/DetailPageSkeleton';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { useResultEntryWorkflow } from './useResultEntryWorkflow';
import { orderTestKey } from '../utils/labSearchAndLinks';
export const ResultEntryQueue: React.FC = () => {
  const { getTest } = useTestNameLookup();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');

  const { items: worklistItems, isLoading: worklistLoading } = useEntryWorklist();
  const { tests: testCatalog } = useResultEntryQueueData();

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
  } = useLabQueueFilters({
    items: allTests,
    workflowType: 'entry',
  });

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
        renderCard={(test, idx, _filtered) => {
          const testItem = test as TestWithContextResult;
          if (testItem.id == null) return null;
          const testDef = getTest(testItem.testCode);
          const resultKey = orderTestKey(testItem.id);
          const isComplete = testDef?.parameters
            ? areAllParametersFilled(resultKey, testDef.parameters.length)
            : false;

          const cardProps = {
            test: testItem,
            testDef,
            resultKey,
            results: results[resultKey] || {},
            technicianNotes: technicianNotes[resultKey] || '',
            isComplete,
            onResultsChange: handleResultChange,
            onNotesChange: handleNotesChange,
            onSave: () => handleSaveResults(testItem.id!, testItem.orderId, allTests, testCatalog),
            onClick: () => openTestModal(testItem, _filtered as TestWithContextResult[]),
          };

          return (
            <ResultEntryCard
              key={`entry-${testItem.id}-${idx}`}
              {...cardProps}
              isMobile={isMobile}
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
        }
      />
    </ErrorBoundary>
  );
};

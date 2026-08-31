/**
 * EntryView - Main view for result entry workflow
 *
 * Displays tests awaiting result entry (status: sample-collected only).
 * Backend enter_results accepts only SAMPLE_COLLECTED; in-progress is not supported.
 */

import React, { useMemo, useCallback } from 'react';
import { useTestCatalog, useTestNameLookup } from '@/features/catalog';
import { useOrdersList } from '@/features/orders';
import type { TestWithContext } from '@/types';
import { EntryCard } from './EntryCard';
import { LabWorkflowView, createLabItemFilter } from '../components/LabWorkflowView';
import { LabFilters } from '../components/LabFilters';
import { useLabWorkflowFilters, useLabTestsFromOrders, useLabUrlSearch } from '@/features/lab/hooks';
import { entryFilterConfig } from '@/features/lab/constants';
import { ErrorBoundary } from '@/components';
import { DetailPageSkeleton } from '@/components/loaders/DetailPageSkeleton';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { useEntryWorkflow } from './useEntryWorkflow';
import type { TestStatus } from '@/types';

 
export const EntryView: React.FC = () => {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { tests: testCatalog, isLoading: testsLoading } = useTestCatalog();
  const { getTest } = useTestNameLookup();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');

  const allTests = useLabTestsFromOrders({
    orders,
    testCatalog,
    statusFilter: ['sample-collected'],
    includePatient: true,
  });

  const {
    results,
    technicianNotes,
    handleResultChange,
    handleNotesChange,
    areAllParametersFilled,
    handleSaveResults,
    openTestModal,
  } = useEntryWorkflow({ allTests, testCatalog, orders });

  const filterTest = useMemo(() => createLabItemFilter<TestWithContext>(), []);
  const getOrderDate = useCallback(
    (t: TestWithContext & { orderDate?: string }) => t.orderDate,
    []
  );
  const getSampleType = useCallback((t: TestWithContext) => t.sampleType, []);
  const getStatus = useCallback((t: TestWithContext) => t.status as TestStatus, []);
  const getPriority = useCallback((t: TestWithContext) => t.priority, []);
  const getQueueSince = useCallback(
    (t: TestWithContext) => t.collectedAt ?? t.orderDate,
    []
  );

  const urlSearch = useLabUrlSearch();

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
  } = useLabWorkflowFilters<TestWithContext, TestStatus>({
    items: allTests,
    getOrderDate,
    getSampleType,
    getStatus,
    searchFilterFn: filterTest,
    initialSearchQuery: urlSearch,
    sortByQueuePriority: true,
    getPriority,
    getQueueSince,
  });

  const isLoading = ordersLoading || testsLoading;
  const hasNoItems = allTests.length === 0;
  if ((isLoading && hasNoItems) || !orders || !testCatalog) {
    return (
      <ErrorBoundary>
        <DetailPageSkeleton variant="workflow-grid" />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <LabWorkflowView
        items={filteredTests}
        renderCard={(test, idx, _filtered) => {
          const testDef = getTest(test.testCode);
          const resultKey = `${test.orderId}-${test.testCode}`;
          const isComplete = testDef?.parameters
            ? areAllParametersFilled(resultKey, testDef.parameters.length)
            : false;

          const cardProps = {
            test,
            testDef,
            resultKey,
            results: results[resultKey] || {},
            technicianNotes: technicianNotes[resultKey] || '',
            isComplete,
            onResultsChange: handleResultChange,
            onNotesChange: handleNotesChange,
            onSave: () => handleSaveResults(test.orderId, test.testCode, allTests, testCatalog, orders),
            onClick: () => openTestModal(test, _filtered),
          };

          return (
            <EntryCard
              key={`${test.orderId}-${test.testCode}-${idx}`}
              {...cardProps}
              isMobile={isMobile}
            />
          );
        }}
        getItemKey={(test, idx) => `${test.orderId}-${test.testCode}-${idx}`}
        emptyIcon="checklist"
        emptyTitle="No Pending Results"
        emptyDescription="There are no samples waiting for result entry."
        filterRow={
          <LabFilters<TestStatus[]>
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

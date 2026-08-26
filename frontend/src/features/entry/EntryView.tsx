/**
 * EntryView - Main view for result entry workflow
 *
 * Displays tests awaiting result entry (status: sample-collected only).
 * Backend enter_results accepts only SAMPLE_COLLECTED; in-progress is not supported.
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { useTestCatalog, useTestNameLookup } from '@/features/catalog/api/useTestCatalog';
import { useOrdersList } from '@/features/orders/api/useOrderQueries';
import type { TestWithContext } from '@/types';
import { EntryCard } from './EntryCard';
import { LabWorkflowView, createLabItemFilter } from '@/features/lab/components/LabWorkflowView';
import { LabFilters } from '@/features/lab/components/LabFilters';
import { useLabWorkflowFilters, useLabTestsFromOrders, useLabUrlSearch } from '@/features/lab/hooks';
import { entryFilterConfig } from '@/features/lab/constants';
import { ErrorBoundary } from '@/components';
import { LabWorkflowViewSkeleton } from '@/features/lab/components/LabWorkflowViewSkeleton';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { useEntryWorkflow } from './useEntryWorkflow';
import type { TestStatus } from '@/types';

// eslint-disable-next-line max-lines-per-function
export const EntryView: React.FC = () => {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { tests: testCatalog, isLoading: testsLoading } = useTestCatalog();
  const { getTest } = useTestNameLookup();
  const { openModal } = useModal();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');

  const {
    results,
    technicianNotes,
    handleResultChange,
    handleNotesChange,
    areAllParametersFilled,
    handleSaveResults,
  } = useEntryWorkflow();

  const allTests = useLabTestsFromOrders({
    orders,
    testCatalog,
    statusFilter: ['sample-collected'],
    includePatient: true,
  });

  const filterTest = useMemo(() => createLabItemFilter<TestWithContext>(), []);
  const getOrderDate = useCallback(
    (t: TestWithContext & { orderDate?: string }) => t.orderDate,
    []
  );
  const getSampleType = useCallback((t: TestWithContext) => t.sampleType, []);
  const getStatus = useCallback((t: TestWithContext) => t.status as TestStatus, []);

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
  });

  // openTestModal stays in the view because it needs a closure over allTests/testCatalog/orders
  const openTestModalRef =
    useRef<(test: TestWithContext, filteredTests: TestWithContext[]) => void>(undefined);

  const openTestModal = useCallback(
    (test: TestWithContext, filteredTests: TestWithContext[]) => {
      if (!testCatalog) return;

      const testDef = getTest(test.testCode);
      const resultKey = `${test.orderId}-${test.testCode}`;
      if (!testDef?.parameters) return;

      const isComplete = areAllParametersFilled(resultKey, testDef.parameters.length);
      const currentIndex = filteredTests.findIndex(
        t => t.orderId === test.orderId && t.testCode === test.testCode
      );

      const onNext =
        currentIndex < filteredTests.length - 1
          ? () => openTestModalRef.current?.(filteredTests[currentIndex + 1], filteredTests)
          : undefined;
      const onPrev =
        currentIndex > 0
          ? () => openTestModalRef.current?.(filteredTests[currentIndex - 1], filteredTests)
          : undefined;

      openModal(ModalType.RESULT_DETAIL, {
        test,
        testDef,
        resultKey,
        results: results[resultKey] || {},
        technicianNotes: technicianNotes[resultKey] || '',
        isComplete,
        onResultsChange: handleResultChange,
        onNotesChange: handleNotesChange,
        onSave: (finalResults?: Record<string, string>, finalNotes?: string) =>
          handleSaveResults(test.orderId, test.testCode, allTests, testCatalog, orders, finalResults, finalNotes),
        onNext,
        onPrev,
      });
    },
    [
      testCatalog,
      getTest,
      results,
      technicianNotes,
      areAllParametersFilled,
      handleResultChange,
      handleNotesChange,
      handleSaveResults,
      allTests,
      orders,
      openModal,
    ]
  );

  useEffect(() => {
    openTestModalRef.current = openTestModal;
  }, [openTestModal]);

  const isLoading = ordersLoading || testsLoading;
  const hasNoItems = allTests.length === 0;
  if ((isLoading && hasNoItems) || !orders || !testCatalog) {
    return (
      <ErrorBoundary>
        <LabWorkflowViewSkeleton />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <LabWorkflowView
        items={filteredTests}
        renderCard={(test, idx, filtered) => {
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
            onClick: () => openTestModal(test, filtered as TestWithContext[]),
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

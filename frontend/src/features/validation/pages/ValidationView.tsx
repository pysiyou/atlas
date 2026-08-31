/**
 * ValidationView - Main view for result validation workflow
 *
 * Displays tests awaiting validation (status: resulted and not yet validated).
 */

import React, { useMemo, useCallback } from 'react';
import { useTestCatalog } from '@/features/catalog/api/useTestCatalog';
import { useOrdersList } from '@/features/orders/api/useOrderQueries';
import { ValidationCard } from '../components/ValidationCard';
import { LabWorkflowView, createLabItemFilter } from '@/features/lab/components/LabWorkflowView';
import { LabFilters } from '@/features/lab/components/LabFilters';
import { useLabWorkflowFilters, useLabTestsFromOrders, useLabUrlSearch } from '@/features/lab/hooks';
import { validationFilterConfig } from '@/features/lab/constants';
import { ErrorBoundary } from '@/components';
import { SectionLoadingBoundary } from '@/components/loaders';
import { useMinDisplay } from '@/hooks/useMinDisplay';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import type { PriorityLevel, TestWithContext } from '@/types';
import { useValidationWorkflow } from '../hooks/useValidationWorkflow';

export const ValidationView: React.FC = () => {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { tests: testCatalog, isLoading: testsLoading } = useTestCatalog();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');
  const urlSearch = useLabUrlSearch();

  const {
    comments,
    pendingValidateKey,
    handleCommentsChange,
    handleValidate,
    openValidationModal,
    validateMutation,
  } = useValidationWorkflow(ordersLoading);

  const allTests = useLabTestsFromOrders({
    orders,
    testCatalog,
    statusFilter: ['resulted'],
    onlyUnvalidated: true,
    includeHasCriticalValues: true,
    includePatient: true,
  });

  const filterTest = useMemo(() => createLabItemFilter<TestWithContext>(), []);
  const getOrderDate = useCallback(
    (t: TestWithContext & { orderDate?: string }) => t.orderDate,
    []
  );
  const getSampleType = useCallback((t: TestWithContext) => t.sampleType, []);
  const getPriority = useCallback(
    (t: TestWithContext & { hasCriticalValues?: boolean }) => t.priority as PriorityLevel,
    []
  );
  const getQueueSince = useCallback(
    (t: TestWithContext) => t.resultEnteredAt ?? t.orderDate,
    []
  );

  const {
    filteredItems: filteredTests,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    sampleTypeFilters,
    setSampleTypeFilters,
    statusFilters: priorityFilters,
    setStatusFilters: setPriorityFilters,
  } = useLabWorkflowFilters<TestWithContext & { hasCriticalValues?: boolean }, PriorityLevel>({
    items: allTests,
    getOrderDate,
    getSampleType,
    getStatus: getPriority,
    searchFilterFn: filterTest,
    initialSearchQuery: urlSearch,
    sortByQueuePriority: true,
    getPriority,
    getQueueSince,
  });

  const sectionLoading = useMinDisplay(ordersLoading || testsLoading, 500);

  return (
    <ErrorBoundary>
      <SectionLoadingBoundary
        loading={sectionLoading}
        message="Loading validation..."
        size="lg"
      >
        <LabWorkflowView
          items={filteredTests}
          renderCard={test => {
            const commentKey = `${test.orderId}-${test.testCode}`;
            return (
              <ValidationCard
                test={test}
                commentKey={commentKey}
                comments={comments[commentKey] || ''}
                onCommentsChange={handleCommentsChange}
                onApprove={() => handleValidate(test.orderId, test.testCode, true)}
                onReject={() => handleValidate(test.orderId, test.testCode, false)}
                onClick={() => openValidationModal(test)}
                isApproving={validateMutation.isPending && pendingValidateKey === commentKey}
                isMobile={isMobile}
              />
            );
          }}
          getItemKey={(test, idx) => `${test.orderId}-${test.testCode}-${idx}`}
          emptyIcon="shield-check"
          emptyTitle="No Pending Validations"
          emptyDescription="There are no results waiting for validation."
          filterRow={
            <LabFilters<PriorityLevel[]>
              config={validationFilterConfig}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              sampleTypeFilters={sampleTypeFilters}
              onSampleTypeFiltersChange={setSampleTypeFilters}
              statusFilters={priorityFilters}
              onStatusFiltersChange={setPriorityFilters}
            />
          }
        />
      </SectionLoadingBoundary>
    </ErrorBoundary>
  );
};

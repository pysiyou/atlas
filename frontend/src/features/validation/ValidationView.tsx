/**
 * ValidationView - Main view for result validation workflow
 *
 * Displays tests awaiting validation (status: resulted and not yet validated).
 */

import React, { useMemo, useCallback } from 'react';
import { useTestCatalog } from '@/features/catalog/api/useTestCatalog';
import { useOrdersList } from '@/features/orders/api/useOrderQueries';
import { ValidationCard } from './ValidationCard';
import {
  BulkValidationToolbar,
  useBulkSelection,
  ValidationCheckbox,
} from './BulkValidationToolbar';
import { LabWorkflowView, createLabItemFilter } from '@/features/lab/components/LabWorkflowView';
import { LabFilters } from '@/features/lab/components/LabFilters';
import { useLabWorkflowFilters, useLabTestsFromOrders } from '@/features/lab/hooks';
import { validationFilterConfig } from '@/features/lab/constants';
import { ErrorBoundary } from '@/components';
import { SectionLoadingBoundary } from '@/components/loading';
import { useMinDisplay } from '@/hooks/useMinDisplay';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import type { PriorityLevel, TestWithContext } from '@/types';
import { useValidationWorkflow } from './useValidationWorkflow';

/**
 * Feature flag to enable/disable bulk validation (select all) feature
 * Set to false to disable the select all checkbox and bulk validation toolbar
 */
const ENABLE_BULK_VALIDATION = false;

// eslint-disable-next-line max-lines-per-function
export const ValidationView: React.FC = () => {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { tests: testCatalog, isLoading: testsLoading } = useTestCatalog();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');

  const {
    comments,
    pendingValidateKey,
    handleCommentsChange,
    handleValidate,
    handleBulkApprove,
    openValidationModal,
    validateMutation,
    rejectMutation,
    bulkMutation,
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
  const getStatus = useCallback(
    (t: TestWithContext & { hasCriticalValues?: boolean }) => t.priority as PriorityLevel,
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
    statusFilters,
    setStatusFilters,
  } = useLabWorkflowFilters<TestWithContext & { hasCriticalValues?: boolean }, PriorityLevel>({
    items: allTests,
    getOrderDate,
    getSampleType,
    getStatus,
    searchFilterFn: filterTest,
  });

  const filteredTestsWithId = useMemo(
    () => filteredTests.filter((t): t is typeof t & { id: number } => typeof t.id === 'number'),
    [filteredTests]
  );

  const { selectedIds, setSelectedIds, toggleItem, isSelected } = useBulkSelection(
    ENABLE_BULK_VALIDATION ? filteredTestsWithId : []
  );

  const onBulkApprove = useCallback(
    async (testIds: number[]) => {
      await handleBulkApprove(testIds, allTests);
      setSelectedIds(new Set());
    },
    [handleBulkApprove, allTests, setSelectedIds]
  );

  const bulkItems = useMemo(
    () =>
      filteredTestsWithId.map(test => ({
        id: test.id,
        orderId: test.orderId,
        testCode: test.testCode,
        hasCriticalValues: test.hasCriticalValues,
      })),
    [filteredTestsWithId]
  );

  const sectionLoading = useMinDisplay(ordersLoading || testsLoading, 500);

  return (
    <ErrorBoundary>
      <SectionLoadingBoundary
        scopeId="validation-table"
        loading={sectionLoading}
        message="Loading validation..."
        size="lg"
      >
        <LabWorkflowView
          items={filteredTests}
          renderCard={test => {
            const commentKey = `${test.orderId}-${test.testCode}`;
            const cardProps = {
              test,
              commentKey,
              comments: comments[commentKey] || '',
              onCommentsChange: handleCommentsChange,
              onApprove: () => handleValidate(test.orderId, test.testCode, true),
              onReject: (reason?: string, type?: 're-test' | 're-collect') =>
                handleValidate(test.orderId, test.testCode, false, reason, type),
              onClick: () => openValidationModal(test),
              isApproving:
                (validateMutation.isPending || rejectMutation.isPending) &&
                pendingValidateKey === commentKey,
            };

            if (!isMobile && typeof test.id === 'number' && ENABLE_BULK_VALIDATION) {
              return (
                <div className="flex items-start gap-3">
                  <div className="pt-4">
                    <ValidationCheckbox
                      id={test.id}
                      isSelected={isSelected(test.id)}
                      onToggle={toggleItem}
                      disabled={bulkMutation.isPending}
                    />
                  </div>
                  <div className="flex-1">
                    <ValidationCard {...cardProps} isMobile={isMobile} />
                  </div>
                </div>
              );
            }

            return <ValidationCard {...cardProps} isMobile={isMobile} />;
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
              statusFilters={statusFilters}
              onStatusFiltersChange={setStatusFilters}
            />
          }
          afterFilterRow={
            ENABLE_BULK_VALIDATION && !isMobile && filteredTestsWithId.length > 0 ? (
              <BulkValidationToolbar
                items={bulkItems}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onBulkApprove={onBulkApprove}
                isProcessing={bulkMutation.isPending}
                enabled={ENABLE_BULK_VALIDATION}
              />
            ) : undefined
          }
        />
      </SectionLoadingBoundary>
    </ErrorBoundary>
  );
};

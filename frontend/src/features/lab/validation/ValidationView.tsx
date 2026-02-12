/**
 * ValidationView - Main view for result validation workflow
 *
 * Displays tests awaiting validation (status: resulted and not yet validated).
 */
/* eslint-disable max-lines */

import React, { useState, useMemo, useCallback } from 'react';
import {
  useOrdersList,
  useInvalidateOrders,
  useOrderLookup,
  useTestCatalog,
} from '@/hooks/queries';
import {
  useValidateResults,
  useRejectResults,
  useValidateBulk,
} from '@/hooks/queries/useResultMutations';
import { toast } from '@/shared/components/feedback';
import { logger } from '@/utils/logger';
import { ValidationCard } from './ValidationCard';
import { BulkValidationToolbar, useBulkSelection, ValidationCheckbox } from './BulkValidationToolbar';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { LabWorkflowView, createLabItemFilter } from '../components/LabWorkflowView';
import { LabFilters } from '../components/LabFilters';
import { useLabWorkflowFilters, useLabTestsFromOrders } from '../hooks';
import { validationFilterConfig } from '../constants';
import { ErrorBoundary, LoadingState } from '@/shared/components';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import type { PriorityLevel, TestWithContext } from '@/types';
import { orderHasValidatedTests } from '@/features/order/utils';
import { getErrorMessage, isLikelyNetworkOrTimeout } from '@/utils/errorHelpers';

/**
 * Feature flag to enable/disable bulk validation (select all) feature
 * Set to false to disable the select all checkbox and bulk validation toolbar
 */
const ENABLE_BULK_VALIDATION = false;

// Large component is necessary for comprehensive validation view with filtering, sorting, card rendering, and validation functionality
// eslint-disable-next-line max-lines-per-function
export const ValidationView: React.FC = () => {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { invalidateAll: invalidateOrders } = useInvalidateOrders();
  const { getOrder } = useOrderLookup();
  const { tests: testCatalog, isLoading: testsLoading } = useTestCatalog();
  const { openModal } = useModal();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');
  const [comments, setComments] = useState<Record<string, string>>({});
  const [pendingValidateKey, setPendingValidateKey] = useState<string | null>(null);

  const validateMutation = useValidateResults();
  const rejectMutation = useRejectResults();
  const bulkMutation = useValidateBulk();

  const allTests = useLabTestsFromOrders({
    orders,
    testCatalog,
    statusFilter: ['resulted'],
    onlyUnvalidated: true,
    includeHasCriticalValues: true,
    includePatient: true,
  });

  const filterTest = useMemo(() => createLabItemFilter<TestWithContext>(), []);

  const getOrderDate = useCallback((t: TestWithContext & { orderDate?: string }) => t.orderDate, []);
  const getSampleType = useCallback((t: TestWithContext) => t.sampleType, []);
  const getStatus = useCallback((t: TestWithContext & { hasCriticalValues?: boolean }) => t.priority as PriorityLevel, []);

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

  /** Filtered tests with numeric id (for bulk selection) */
  const filteredTestsWithId = useMemo(
    () =>
      filteredTests.filter(
        (t): t is typeof t & { id: number } => typeof t.id === 'number'
      ),
    [filteredTests]
  );

  // Bulk selection state (over visible/filtered items with id)
  // Only initialize if bulk validation is enabled
  const {
    selectedIds,
    setSelectedIds,
    toggleItem,
    isSelected,
  } = useBulkSelection(ENABLE_BULK_VALIDATION ? filteredTestsWithId : []);

  /**
   * Handle bulk approval via useValidateBulk. Returns Promise so toolbar can await.
   */
  const handleBulkApprove = useCallback(
    async (testIds: number[]): Promise<void> => {
      if (testIds.length === 0) return;

      const items = testIds
        .map(testId => {
          const test = allTests.find(t => t.id === testId);
          return test ? { orderId: test.orderId, testCode: test.testCode } : null;
        })
        .filter((item): item is { orderId: number; testCode: string } => item !== null);

      if (items.length === 0) {
        toast.error({
          title: 'No valid tests selected',
          subtitle: 'Select at least one test from the list before running bulk approval.',
        });
        return;
      }

      try {
        const response = await bulkMutation.mutateAsync({
          items,
          validationNotes: 'Bulk approved',
        });
        const results = response?.results ?? [];
        const successCount = response?.successCount ?? 0;
        const failureCount = response?.failureCount ?? 0;
        if (failureCount === 0) {
          toast.success({
            title: `Successfully approved ${successCount} result(s)`,
            subtitle: 'All selected results have been approved and the orders have been updated.',
          });
        } else {
          const failedItems = results
            .filter(r => !r.success)
            .map(r => `${r.testCode} (Order ${r.orderId})`)
            .join(', ');
          toast.error({
            title: `Approved ${successCount}, failed ${failureCount}${failedItems ? `: ${failedItems}` : ''}`,
            subtitle: 'Some results could not be approved. Check the failed items and try again if needed.',
          });
        }
        setSelectedIds(new Set());
      } catch (error) {
        logger.error('Error in bulk validation', error instanceof Error ? error : undefined);
        toast.error({
          title: 'Failed to approve results. Please try again.',
          subtitle: 'The bulk approval request failed. Check your connection and try again.',
        });
      }
    },
    [allTests, bulkMutation, setSelectedIds]
  );

  const handleCommentsChange = useCallback((commentKey: string, value: string) => {
    setComments(prev => ({ ...prev, [commentKey]: value }));
  }, []);

  /**
   * Handle validation (approval or rejection) via useValidateResults / useRejectResults.
   * Returns a Promise so modals can await and close on success. When approve=false and
   * both rejectionNotes and rejectionType are undefined, RejectionDialog already called the API.
   */
  const handleValidate = useCallback(
    async (
      orderId: number | string,
      testCode: string,
      approve: boolean,
      rejectionNotes?: string,
      rejectionType?: 're-test' | 're-collect'
    ): Promise<void> => {
      if (ordersLoading) return;

      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      const commentKey = `${orderIdStr}-${testCode}`;
      const clearPending = () => setPendingValidateKey(null);

      if (approve) {
        setPendingValidateKey(commentKey);
        try {
          await validateMutation.mutateAsync({
            orderId: orderIdStr,
            testCode,
            validationNotes: comments[commentKey] || undefined,
          });
          toast.success({
            title: 'Results approved',
            subtitle: 'These results have been approved and are now final. The order status has been updated.',
          });
          setComments(prev => {
            const n = { ...prev };
            delete n[commentKey];
            return n;
          });
        } catch (error) {
          logger.error('Error validating results', error instanceof Error ? error : undefined);
          if (isLikelyNetworkOrTimeout(error)) {
            toast.error({
              title: 'Action may have completed',
              subtitle: 'The request did not complete. Please refresh the page to see the latest status.',
            });
          } else {
            toast.error({
              title: `Failed to validate results: ${getErrorMessage(error, 'Unknown error')}`,
              subtitle: 'The validation request failed. Please try again or contact support if the issue persists.',
            });
          }
          throw error;
        } finally {
          clearPending();
        }
        return;
      }

      const alreadyRejected = rejectionNotes === undefined && rejectionType === undefined;
      if (alreadyRejected) {
        await invalidateOrders();
        toast.success({
          title: 'Results rejected',
          subtitle: 'These results have been rejected. A re-test or new sample may have been requested.',
        });
        setComments(prev => {
          const n = { ...prev };
          delete n[commentKey];
          return n;
        });
        return;
      }

      if (!rejectionNotes) {
        const confirmed = window.confirm('Are you sure you want to reject these results?');
        if (!confirmed) return;
      }
      const rejectType = rejectionType || 're-test';
      setPendingValidateKey(commentKey);
      try {
        await rejectMutation.mutateAsync({
          orderId: orderIdStr,
          testCode,
          rejectionReason: rejectionNotes || 'Rejected by validator',
          rejectionType: rejectType,
        });
        const message =
          rejectType === 're-collect'
            ? 'Sample rejected - new collection required'
            : 'Results rejected - re-test created';
        toast.error({
          title: message,
          subtitle: 'The rejection has been recorded. Follow up on re-test or recollection as needed.',
        });
        setComments(prev => {
          const n = { ...prev };
          delete n[commentKey];
          return n;
        });
      } catch (error) {
        logger.error('Error rejecting results', error instanceof Error ? error : undefined);
        if (isLikelyNetworkOrTimeout(error)) {
          toast.error({
            title: 'Action may have completed',
            subtitle: 'The request did not complete. Please refresh the page to see the latest status.',
          });
        } else {
          toast.error({
            title: `Failed to reject results: ${getErrorMessage(error, 'Unknown error')}`,
            subtitle: 'Please try again or contact support if the issue persists.',
          });
        }
        throw error;
      } finally {
        clearPending();
      }
    },
    [comments, ordersLoading, invalidateOrders, validateMutation, rejectMutation]
  );

  const openValidationModal = useCallback(
    (test: TestWithContext) => {
      const commentKey = `${test.orderId}-${test.testCode}`;

      // Check if the order has validated tests to block re-collect option
      const order = getOrder(test.orderId);
      const hasValidatedTests = order ? orderHasValidatedTests(order) : false;

      openModal(ModalType.VALIDATION_DETAIL, {
        test,
        commentKey,
        comments: comments[commentKey] || '',
        onCommentsChange: handleCommentsChange,
        onApprove: () => handleValidate(test.orderId, test.testCode, true),
        // When RejectionDialog is used, it calls the API directly.
        // Undefined values signal that the API was already called.
        onReject: (reason?: string, type?: 're-test' | 're-collect') =>
          handleValidate(test.orderId, test.testCode, false, reason, type),
        orderHasValidatedTests: hasValidatedTests,
      });
    },
    [comments, handleCommentsChange, handleValidate, openModal, getOrder]
  );

  // Prepare items for bulk validation toolbar (visible/filtered items with id only)
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

  if (ordersLoading || testsLoading) {
    return (
      <ErrorBoundary>
        <LoadingState message="Loading validation..." fullScreen size="lg" />
      </ErrorBoundary>
    );
  }

  const isLoading = ordersLoading || testsLoading;
  const hasNoItems = allTests.length === 0;
  if (isLoading && hasNoItems) {
    return (
      <ErrorBoundary>
        <LoadingState message="Loading validation..." fullScreen />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <LabWorkflowView
        items={filteredTests}
        renderCard={test => {
          const commentKey = `${test.orderId}-${test.testCode}`;
          // Check if the order has validated tests to block re-collect option
          const order = getOrder(test.orderId);
          const hasValidatedTests = order ? orderHasValidatedTests(order) : false;

          const cardProps = {
            test,
            commentKey,
            comments: comments[commentKey] || '',
            onCommentsChange: handleCommentsChange,
            onApprove: () => handleValidate(test.orderId, test.testCode, true),
            onReject: (reason?: string, type?: 're-test' | 're-collect') =>
              handleValidate(test.orderId, test.testCode, false, reason, type),
            onClick: () => openValidationModal(test),
            orderHasValidatedTests: hasValidatedTests,
            isApproving:
              (validateMutation.isPending || rejectMutation.isPending) && pendingValidateKey === commentKey,
          };

          // Desktop: checkbox + card when id present, else card only
          // Only show checkbox if bulk validation is enabled
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
              onBulkApprove={handleBulkApprove}
              isProcessing={bulkMutation.isPending}
              enabled={ENABLE_BULK_VALIDATION}
            />
          ) : undefined
        }
      />
    </ErrorBoundary>
  );
};

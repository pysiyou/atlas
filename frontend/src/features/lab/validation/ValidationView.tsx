/**
 * ValidationView - Main view for result validation workflow
 *
 * Displays tests awaiting validation (status: resulted and not yet validated).
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  useOrdersList,
  useInvalidateOrders,
  useOrderLookup,
  useTestCatalog,
  useTestNameLookup,
  useSampleLookup,
  usePatientNameLookup,
} from '@/hooks/queries';
import { getTestSampleType } from '@/utils/typeHelpers';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import { ValidationCard } from './ValidationCard';
import { BulkValidationToolbar, useBulkSelection, ValidationCheckbox } from './BulkValidationToolbar';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { LabWorkflowView, createLabItemFilter } from '../components/LabWorkflowView';
import { DataErrorBoundary } from '@/shared/components';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import type { PriorityLevel, TestWithContext, CollectedSample } from '@/types';
import { resultAPI } from '@/services/api';
import { orderHasValidatedTests } from '@/features/order/utils';
import { ValidationFilters } from '../components/filters';

/**
 * Feature flag to enable/disable bulk validation (select all) feature
 * Set to false to disable the select all checkbox and bulk validation toolbar
 */
const ENABLE_BULK_VALIDATION = false;

// Large component is necessary for comprehensive validation view with filtering, sorting, card rendering, and validation functionality
// eslint-disable-next-line max-lines-per-function
export const ValidationView: React.FC = () => {
  const { orders, refetch: refreshOrders } = useOrdersList();
  const { invalidateAll: invalidateOrders } = useInvalidateOrders();
  const { getOrder } = useOrderLookup();
  const { tests: testCatalog } = useTestCatalog();
  const { getTest } = useTestNameLookup();
  const { getSample } = useSampleLookup();
  const { getPatientName, getPatient } = usePatientNameLookup();
  const { openModal } = useModal();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [sampleTypeFilters, setSampleTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<PriorityLevel[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({});
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Build list of tests awaiting validation
  // Excludes superseded tests (those replaced by retests)
  const allTests: (TestWithContext & { hasCriticalValues?: boolean })[] = useMemo(() => {
    if (!orders || !testCatalog) return [];

    return orders.flatMap(order => {
      const patientName = getPatientName(order.patientId);
      const patient = getPatient(order.patientId);
      const patientDob = patient?.dateOfBirth;

      return order.tests
        .filter(
          test =>
            // Filter for tests awaiting validation (resulted but not yet validated)
            // Superseded tests are already excluded by status check
            test.status === 'resulted' && !test.validatedBy
        )
        .map(test => {
          const testName = getTest(test.testCode)?.name || test.testCode;
          const sampleType = getTestSampleType(test.testCode, testCatalog);
          const sample = test.sampleId ? getSample(test.sampleId) : undefined;

          const collectedAt =
            sample?.status === 'collected' ? (sample as CollectedSample).collectedAt : undefined;
          const collectedBy =
            sample?.status === 'collected' ? (sample as CollectedSample).collectedBy : undefined;

          // Check for critical values from flags
          const hasCriticalValues = test.flags?.some(
            (f: string) => f.includes('critical') || f.includes('CRITICAL')
          ) || test.hasCriticalValues;

          return {
            ...test,
            orderId: order.orderId,
            orderDate: order.orderDate,
            patientId: order.patientId,
            patientName,
            patientDob,
            testName,
            sampleType,
            priority: order.priority,
            referringPhysician: order.referringPhysician,
            collectedAt,
            collectedBy,
            resultEnteredAt: test.resultEnteredAt ?? undefined,
            resultValidatedAt: test.resultValidatedAt ?? undefined,
            results: test.results ?? undefined,
            hasCriticalValues,
            // Include retest tracking info
            isRetest: test.isRetest,
            retestOfTestId: test.retestOfTestId,
            retestNumber: test.retestNumber,
            resultRejectionHistory: test.resultRejectionHistory,
            // Include sample recollection info
            sampleIsRecollection: sample?.isRecollection,
            sampleOriginalSampleId: sample?.originalSampleId,
            sampleRecollectionReason: sample?.recollectionReason,
            sampleRecollectionAttempt: sample?.recollectionAttempt,
            sampleRejectionHistory: sample?.rejectionHistory,
          };
        });
    });
  }, [orders, testCatalog, getPatientName, getPatient, getTest, getSample]);

  const filterTest = useMemo(() => createLabItemFilter<TestWithContext>(), []);

  const filteredTests = useMemo(() => {
    let out = allTests;

    if (dateRange) {
      const [start, end] = dateRange;
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      out = out.filter(t => {
        const d = (t as { orderDate?: string }).orderDate;
        if (!d) return false;
        const orderDate = new Date(d);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    if (sampleTypeFilters.length > 0) {
      out = out.filter(
        t => t.sampleType && sampleTypeFilters.includes(t.sampleType)
      );
    }

    if (statusFilters.length > 0) {
      out = out.filter(
        t => t.priority && statusFilters.includes(t.priority as PriorityLevel)
      );
    }

    if (searchQuery.trim()) {
      out = out.filter(t => filterTest(t, searchQuery));
    }

    return out;
  }, [allTests, dateRange, sampleTypeFilters, statusFilters, searchQuery, filterTest]);

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
   * Handle bulk approval of selected tests
   * Uses the bulk validation endpoint for efficient processing
   */
  const handleBulkApprove = useCallback(async (testIds: number[]) => {
    if (testIds.length === 0) return;

    setIsBulkProcessing(true);

    try {
      // Map test IDs to bulk validation items
      const items = testIds
        .map(testId => {
          const test = allTests.find(t => t.id === testId);
          return test ? { orderId: test.orderId, testCode: test.testCode } : null;
        })
        .filter((item): item is { orderId: number; testCode: string } => item !== null);

      if (items.length === 0) {
        toast.error('No valid tests selected');
        return;
      }

      // Call bulk validation endpoint
      const response = await resultAPI.validateBulk(items, 'Bulk approved');

      await invalidateOrders();
      await refreshOrders();

      if (response.failureCount === 0) {
        toast.success(`Successfully approved ${response.successCount} result(s)`);
      } else {
        // Show detailed error for failed items
        const failedItems = response.results
          .filter(r => !r.success)
          .map(r => `${r.testCode} (Order ${r.orderId})`)
          .join(', ');
        toast.error(
          `Approved ${response.successCount}, failed ${response.failureCount}${failedItems ? `: ${failedItems}` : ''}`
        );
      }

      // Clear selection
      setSelectedIds(new Set());
    } catch (error) {
      logger.error('Error in bulk validation', error instanceof Error ? error : undefined);
      toast.error('Failed to approve results. Please try again.');
    } finally {
      setIsBulkProcessing(false);
    }
  }, [allTests, invalidateOrders, refreshOrders, setSelectedIds]);

  const handleCommentsChange = useCallback((commentKey: string, value: string) => {
    setComments(prev => ({ ...prev, [commentKey]: value }));
  }, []);

  /**
   * Handle validation (approval or rejection) of test results.
   *
   * @param orderId - Order ID
   * @param testCode - Test code
   * @param approve - True for approval, false for rejection
   * @param rejectionNotes - Reason for rejection (if rejecting)
   * @param rejectionType - Type of rejection action (if rejecting)
   *
   * NOTE: When called with approve=false and BOTH rejectionNotes and rejectionType
   * are undefined, this indicates the rejection was already performed by the
   * RejectionDialog and we only need to refresh the data.
   */
  const handleValidate = useCallback(
    async (
      orderId: number | string,
      testCode: string,
      approve: boolean,
      rejectionNotes?: string,
      rejectionType?: 're-test' | 're-collect'
    ) => {
      if (!orders) return;

      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      const commentKey = `${orderIdStr}-${testCode}`;

      // Prevent concurrent validations
      if (isValidating[commentKey]) {
        return;
      }

      setIsValidating(prev => ({ ...prev, [commentKey]: true }));

      try {
        if (approve) {
          // Use validate endpoint for approvals
          await resultAPI.validateResults(orderIdStr, testCode, {
            decision: 'approved',
            validationNotes: comments[commentKey] || undefined,
          });
          await invalidateOrders();
          await refreshOrders();
          toast.success('Results approved');
        } else {
          // Check if the rejection was already performed by the RejectionDialog.
          // When both rejectionNotes and rejectionType are undefined, the dialog
          // already called the API and we only need to refresh the data.
          const alreadyRejected = rejectionNotes === undefined && rejectionType === undefined;

          if (alreadyRejected) {
            // Rejection was already performed by RejectionDialog - just refresh
            await invalidateOrders();
            await refreshOrders();
            toast.success('Results rejected');
          } else {
            // Legacy path: rejection not yet performed, we need to call the API
            if (!rejectionNotes) {
              const confirmed = window.confirm('Are you sure you want to reject these results?');
              if (!confirmed) {
                setIsValidating(prev => ({ ...prev, [commentKey]: false }));
                return;
              }
            }

            const rejectType = rejectionType || 're-test'; // Default to re-test
            await resultAPI.rejectResults(orderIdStr, testCode, {
              rejectionReason: rejectionNotes || 'Rejected by validator',
              rejectionType: rejectType,
            });
            await invalidateOrders();
            await refreshOrders();

            const message =
              rejectType === 're-collect'
                ? 'Sample rejected - new collection required'
                : 'Results rejected - re-test created';
            toast.error(message);
          }
        }

        // Clear local state
        setComments(prev => {
          const n = { ...prev };
          delete n[commentKey];
          return n;
        });
      } catch (error) {
        logger.error('Error validating results', error instanceof Error ? error : undefined);
        // Extract error message from API error (APIError interface has a message property)
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error as { message: string }).message
            : 'Unknown error';
        toast.error(`Failed to validate results: ${errorMessage}`);
      } finally {
        setIsValidating(prev => ({ ...prev, [commentKey]: false }));
      }
    },
    [comments, orders, isValidating, invalidateOrders, refreshOrders]
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
        // When RejectionDialogContent is used, it calls the API directly.
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

  if (!orders || !testCatalog) {
    return <div>Loading...</div>;
  }

  return (
    <DataErrorBoundary>
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
                    disabled={isBulkProcessing}
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
          <ValidationFilters
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
              isProcessing={isBulkProcessing}
              enabled={ENABLE_BULK_VALIDATION}
            />
          ) : undefined
        }
      />
    </DataErrorBoundary>
  );
};

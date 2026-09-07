/**
 * ValidationView - Result validation and supervisor exception review.
 *
 * Displays tests awaiting validation (resulted, unvalidated).
 * Supervisors also see escalated tests and recollection requests in the same queue.
 */

import React, { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/app/store';
import { useTestCatalog } from '@/features/catalog';
import { useInvalidateOrders, useOrdersList } from '@/features/orders';
import { ValidationCard } from './ValidationCard';
import { EscalationCard } from './EscalationCard';
import { createLabItemFilter } from '../components/LabWorkflowView';
import { LabQueueSection } from '../components/LabQueueSection';
import { LabFilters } from '../components/LabFilters';
import { useLabWorkflowFilters, useLabTestsFromOrders, useLabUrlSearch } from '@/features/lab/hooks';
import { validationFilterConfig } from '@/features/lab/constants';
import { ErrorBoundary, EmptyState } from '@/components';
import { SectionLoadingBoundary } from '@/components/loaders';
import { useMinDisplay } from '@/hooks/useMinDisplay';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import type { PriorityLevel, TestWithContext } from '@/types';
import { useValidationWorkflow } from './useValidationWorkflow';
import { orderTestKey } from '@/features/lab/utils/orderTestKey';
import { usePendingEscalation } from './results.api';
import {
  usePendingRecollectionRequests,
  useApproveRecollectionRequest,
  useDenyRecollectionRequest,
} from '@/features/lab/api/recollection-requests.api';
import { RecollectionRequestCard } from './RecollectionRequestCard';
import { toast } from '@/app/AppToastBar';

export const ValidationView: React.FC = () => {
  const { hasRole } = useAuthStore();
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { tests: testCatalog, isLoading: testsLoading } = useTestCatalog();
  const {
    escalatedTests,
    isLoading: escalationLoading,
    refetch: refetchEscalation,
    invalidatePendingEscalation,
  } = usePendingEscalation();
  const {
    requests: recollectionRequests,
    isLoading: recollectionLoading,
    refetch: refetchRecollection,
  } = usePendingRecollectionRequests();
  const approveRecollection = useApproveRecollectionRequest();
  const denyRecollection = useDenyRecollectionRequest();
  const { invalidateAll: invalidateOrders } = useInvalidateOrders();
  const { openModal } = useModal();
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

  const sectionLoading = useMinDisplay(
    ordersLoading || testsLoading || (canResolveEscalation && (escalationLoading || recollectionLoading)),
    500
  );

  const handleApproveRecollection = useCallback(
    async (requestId: number, reviewNotes?: string) => {
      try {
        await approveRecollection.mutateAsync({ requestId, reviewNotes });
        toast.success({
          title: 'Redraw approved',
          subtitle: 'A pending collection tube is now available in Sample Collection.',
        });
        await invalidateOrders();
        await refetchRecollection();
      } catch {
        toast.error({ title: 'Failed to approve redraw', subtitle: 'Please try again.' });
      }
    },
    [approveRecollection, invalidateOrders, refetchRecollection]
  );

  const handleDenyRecollection = useCallback(
    async (requestId: number, reviewNotes?: string) => {
      try {
        await denyRecollection.mutateAsync({ requestId, reviewNotes });
        toast.success({
          title: 'Redraw denied',
          subtitle: 'Affected tests have been cancelled.',
        });
        await invalidateOrders();
        await refetchRecollection();
      } catch {
        toast.error({ title: 'Failed to deny redraw', subtitle: 'Please try again.' });
      }
    },
    [denyRecollection, invalidateOrders, refetchRecollection]
  );

  const openEscalationModal = useCallback(
    (test: TestWithContext) => {
      openModal(ModalType.ESCALATION_RESOLUTION_DETAIL, {
        test,
        onResolved: async () => {
          invalidatePendingEscalation();
          await invalidateOrders();
          await refetchEscalation();
        },
      });
    },
    [openModal, invalidatePendingEscalation, invalidateOrders, refetchEscalation]
  );

  const getCommentKey = useCallback(
    (test: TestWithContext) => orderTestKey(test.id!),
    []
  );

  const filterRow = (
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
  );

  const hasRecollection = canResolveEscalation && recollectionRequests.length > 0;
  const hasEscalated = canResolveEscalation && escalatedTests.length > 0;
  const hasValidation = filteredTests.length > 0;
  const isEmpty = !hasRecollection && !hasEscalated && !hasValidation;

  return (
    <ErrorBoundary>
      <SectionLoadingBoundary
        loading={sectionLoading}
        message="Loading validation..."
        size="lg"
      >
        <div className="h-full flex flex-col min-h-0">
          <div className="shrink-0">{filterRow}</div>

          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            {isEmpty ? (
              <EmptyState
                icon="shield-check"
                title="No Pending Reviews"
                description="There are no results waiting for validation or supervisor review."
              />
            ) : (
              <div className="space-y-8">
                {hasRecollection && (
                  <LabQueueSection
                    title="Recollection requests"
                    count={recollectionRequests.length}
                  >
                    {recollectionRequests.map(request => (
                      <RecollectionRequestCard
                        key={`recollection-${request.id}`}
                        request={request}
                        onApprove={handleApproveRecollection}
                        onDeny={handleDenyRecollection}
                        isApproving={approveRecollection.isPending}
                        isDenying={denyRecollection.isPending}
                        isMobile={isMobile}
                      />
                    ))}
                  </LabQueueSection>
                )}

                {hasEscalated && (
                  <LabQueueSection title="Supervisor exceptions" count={escalatedTests.length}>
                    {escalatedTests.map((test, idx) => (
                      <EscalationCard
                        key={`escalated-${test.id}-${idx}`}
                        test={test}
                        onClick={() => openEscalationModal(test)}
                        isMobile={isMobile}
                      />
                    ))}
                  </LabQueueSection>
                )}

                {hasValidation && (
                  <LabQueueSection title="Pending validation" count={filteredTests.length}>
                    {filteredTests.map((test, idx) => {
                      if (test.id == null) return null;
                      const commentKey = getCommentKey(test);
                      return (
                        <ValidationCard
                          key={`validation-${test.id}-${idx}`}
                          test={test}
                          commentKey={commentKey}
                          comments={comments[commentKey] || ''}
                          onCommentsChange={handleCommentsChange}
                          onApprove={() => handleValidate(test.id!, test.orderId, true)}
                          onReject={result => handleValidate(test.id!, test.orderId, false, result)}
                          onClick={() => openValidationModal(test)}
                          isApproving={
                            validateMutation.isPending && pendingValidateKey === commentKey
                          }
                          isMobile={isMobile}
                        />
                      );
                    })}
                  </LabQueueSection>
                )}
              </div>
            )}
          </div>
        </div>
      </SectionLoadingBoundary>
    </ErrorBoundary>
  );
};

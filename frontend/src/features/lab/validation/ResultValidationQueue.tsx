/**
 * ResultValidationQueue - Result validation and supervisor exception review.
 *
 * Displays tests awaiting validation (resulted, unvalidated).
 * Supervisors also see escalated tests and recollection requests in the same queue.
 */

import React, { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/app/authStore';
import { useInvalidateOrders } from '@/features/orders';
import { ResultValidationCard } from './ResultValidationCard';
import { EscalationCard } from './EscalationCard';
import { createLabQueueSearchFilter } from '../components/LabWorkflowQueueLayout';
import { LabValidationQueueSection } from '../components/LabValidationQueueSection';
import { LabQueueFilters } from '../components/LabQueueFilters';
import {
  applyLabQueueFilters,
  useLabQueueFilterState,
  useResultValidationQueueData,
  useLabQueueUrlSearch,
} from '@/features/lab/hooks';
import { validationFilterConfig } from '@/features/lab/constants';
import { ErrorBoundary, EmptyState } from '@/components';
import { SectionLoadingBoundary } from '@/components/loaders';
import { useMinDisplay } from '@/hooks/useMinDisplay';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import type { PriorityLevel, TestWithContext } from '@/types';
import type { RecollectionRequestSummary } from '@/types/lab-operations';
import { useResultValidationWorkflow } from './useResultValidationWorkflow';
import { orderTestKey } from '../utils/orderTestKey';
import { usePendingEscalation } from '../api/results.api';
import {
  useApproveRecollectionRequest,
  useDenyRecollectionRequest,
} from '../api/recollectionRequests.api';
import { SampleRecollectionRequestCard } from './SampleRecollectionRequestCard';
import { notify } from '@/utils/feedback';

export const ResultValidationQueue: React.FC = () => {
  const { hasRole } = useAuthStore();
  const canViewEscalations = hasRole(['administrator', 'lab-technician', 'lab-technician-plus']);
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);

  const {
    validationTests: allTests,
    escalations: escalatedTests,
    recollections: recollectionRequests,
    isLoading: dataLoading,
    canResolveEscalation: canResolveFromProvider,
  } = useResultValidationQueueData();

  const {
    isLoading: escalationLoading,
    refetch: refetchEscalation,
    invalidatePendingEscalation,
  } = usePendingEscalation();
  const approveRecollection = useApproveRecollectionRequest();
  const denyRecollection = useDenyRecollectionRequest();
  const { invalidateAll: invalidateOrders } = useInvalidateOrders();
  const { openModal } = useModal();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');
  const urlSearch = useLabQueueUrlSearch();

  const {
    comments,
    pendingValidateKey,
    handleCommentsChange,
    handleValidate,
    openValidationModal,
    validateMutation,
  } = useResultValidationWorkflow(dataLoading);

  const filterTest = useMemo(() => createLabQueueSearchFilter<TestWithContext>(), []);
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
    filterState,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    sampleTypeFilters,
    setSampleTypeFilters,
    statusFilters: priorityFilters,
    setStatusFilters: setPriorityFilters,
  } = useLabQueueFilterState<TestWithContext & { hasCriticalValues?: boolean }, PriorityLevel>({
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

  const filterRecollectionRequest = useMemo(
    () =>
      createLabQueueSearchFilter<RecollectionRequestSummary>(item =>
        [
          item.orderNumber,
          item.patientName,
          ...(item.testCodes ?? []),
          item.rejectedSampleId?.toString(),
        ].filter((value): value is string => Boolean(value))
      ),
    []
  );

  const filteredEscalatedTests = useMemo(
    () =>
      applyLabQueueFilters({
        items: escalatedTests,
        filters: filterState,
        getOrderDate: test => test.orderDate,
        getSampleType: test => test.sampleType,
        getStatus: test => test.priority as PriorityLevel,
        searchFilterFn: filterTest,
        sortByQueuePriority: true,
        getPriority: test => test.priority,
        getQueueSince: test => test.resultEnteredAt ?? test.orderDate,
      }),
    [escalatedTests, filterState, filterTest]
  );

  const filteredRecollectionRequests = useMemo(
    () =>
      applyLabQueueFilters({
        items: canResolveFromProvider ? recollectionRequests : [],
        filters: filterState,
        getOrderDate: request => request.createdAt,
        getSampleType: request => request.sampleType,
        getStatus: () => undefined,
        searchFilterFn: filterRecollectionRequest,
        sortByQueuePriority: true,
        getPriority: () => undefined,
        getQueueSince: request => request.createdAt,
        applyStatusFilter: false,
      }),
    [recollectionRequests, filterState, filterRecollectionRequest, canResolveFromProvider]
  );

  const sectionLoading = useMinDisplay(
    dataLoading || (canViewEscalations && escalationLoading),
    500
  );

  const handleApproveRecollection = useCallback(
    async (requestId: number, reviewNotes?: string) => {
      try {
        await approveRecollection.mutateAsync({ requestId, reviewNotes });
        notify.toast('lab.recollection.approve.success');
        await invalidateOrders();
      } catch (error) {
        notify.apiError('lab.recollection.approve.error', error);
      }
    },
    [approveRecollection, invalidateOrders]
  );

  const handleDenyRecollection = useCallback(
    async (requestId: number, reviewNotes?: string) => {
      try {
        await denyRecollection.mutateAsync({ requestId, reviewNotes });
        notify.toast('lab.recollection.deny.success');
        await invalidateOrders();
      } catch (error) {
        notify.apiError('lab.recollection.deny.error', error);
      }
    },
    [denyRecollection, invalidateOrders]
  );

  const openEscalationModal = useCallback(
    (test: TestWithContext) => {
      openModal(ModalType.ESCALATION_RESOLUTION_DETAIL, {
        test,
        readOnly: !canResolveEscalation,
        onResolved: async () => {
          invalidatePendingEscalation();
          await invalidateOrders();
          await refetchEscalation();
        },
      });
    },
    [openModal, canResolveEscalation, invalidatePendingEscalation, invalidateOrders, refetchEscalation]
  );

  const getCommentKey = useCallback(
    (test: TestWithContext) => orderTestKey(test.id!),
    []
  );

  const filterRow = (
    <LabQueueFilters<PriorityLevel[]>
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

  const hasRecollection = canResolveEscalation && filteredRecollectionRequests.length > 0;
  const hasEscalated = canViewEscalations && filteredEscalatedTests.length > 0;
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
                title="No Pending Validation"
                description="There are no results waiting for validation or supervisor review."
              />
            ) : (
              <div className="space-y-8">
                {hasRecollection && (
                  <LabValidationQueueSection
                    title="Recollection requests"
                    count={filteredRecollectionRequests.length}
                  >
                    {filteredRecollectionRequests.map(request => (
                      <SampleRecollectionRequestCard
                        key={`recollection-${request.id}`}
                        request={request}
                        onApprove={handleApproveRecollection}
                        onDeny={handleDenyRecollection}
                        isApproving={approveRecollection.isPending}
                        isDenying={denyRecollection.isPending}
                        isMobile={isMobile}
                      />
                    ))}
                  </LabValidationQueueSection>
                )}

                {hasEscalated && (
                  <LabValidationQueueSection
                    title={
                      canResolveEscalation
                        ? 'Supervisor exceptions'
                        : 'Awaiting supervisor approval'
                    }
                    count={filteredEscalatedTests.length}
                  >
                    {filteredEscalatedTests.map((test, idx) => (
                      <EscalationCard
                        key={`escalated-${test.id}-${idx}`}
                        test={test}
                        onClick={() => openEscalationModal(test)}
                        isMobile={isMobile}
                      />
                    ))}
                  </LabValidationQueueSection>
                )}

                {hasValidation && (
                  <LabValidationQueueSection title="Pending validation" count={filteredTests.length}>
                    {filteredTests.map((test, idx) => {
                      if (test.id == null) return null;
                      const commentKey = getCommentKey(test);
                      return (
                        <ResultValidationCard
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
                  </LabValidationQueueSection>
                )}
              </div>
            )}
          </div>
        </div>
      </SectionLoadingBoundary>
    </ErrorBoundary>
  );
};

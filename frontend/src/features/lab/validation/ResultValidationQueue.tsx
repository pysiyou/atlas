/**
 * ResultValidationQueue - Result validation and supervisor exception review.
 */

import React, { useMemo } from 'react';
import { useAuthStore } from '@/app/authStore';
import { createLabQueueSearchFilter, LabWorkflowQueueScaffold } from '../components/LabWorkflowQueueLayout';
import { LabQueueFilters } from '../components/LabQueueFilters';
import {
  applyLabQueueFilters,
  useLabQueueFilters,
  useResultValidationQueueData,
} from '../hooks';
import { validationFilterConfig } from '../constants';
import { ErrorBoundary } from '@/components';
import { SectionLoadingBoundary } from '@/components/loaders';
import { useMinDisplay } from '@/hooks/useMinDisplay';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import type { PriorityLevel, TestWithContext } from '@/types';
import type { RecollectionRequestSummary } from '@/types/lab-operations';
import { useResultValidationWorkflow } from './useResultValidationWorkflow';
import { orderTestKey } from '../utils/labSearchAndLinks';
import { usePendingEscalation } from '../api/results';
import { ResultValidationQueueView } from './ResultValidationQueueView';
import { useResultValidationQueueActions } from './useResultValidationQueueActions';

const filterTest = createLabQueueSearchFilter<TestWithContext>();
const filterRecollectionRequest = createLabQueueSearchFilter<RecollectionRequestSummary>(item =>
  [item.orderNumber, item.patientName, ...(item.testCodes ?? []), item.rejectedSampleId?.toString()].filter(
    (value): value is string => Boolean(value),
  ),
);

function getCommentKey(test: TestWithContext) {
  return orderTestKey(test.id!);
}

export const ResultValidationQueue: React.FC = () => {
  const { hasRole } = useAuthStore();
  const canViewEscalations = hasRole(['administrator', 'lab-technician', 'lab-technician-plus']);
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);

  const {
    validationTests,
    escalations: escalatedTests,
    recollections: recollectionRequests,
    isLoading: dataLoading,
    canResolveEscalation: canResolveFromProvider,
  } = useResultValidationQueueData();
  const allTests = validationTests;

  const {
    isLoading: escalationLoading,
    refetch: refetchEscalation,
    invalidatePendingEscalation,
  } = usePendingEscalation();
  const isMobile = isBreakpointAtMost(useBreakpoint(), 'sm');

  const {
    comments,
    pendingValidateKey,
    handleCommentsChange,
    handleValidate,
    openValidationModal,
    validateMutation,
  } = useResultValidationWorkflow(dataLoading);

  const {
    handleApproveRecollection,
    handleDenyRecollection,
    openEscalationModal,
    isApprovingRecollection,
    isDenyingRecollection,
  } = useResultValidationQueueActions({
    canResolveEscalation,
    invalidatePendingEscalation,
    refetchEscalation,
  });

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
  } = useLabQueueFilters({
    items: allTests,
    workflowType: 'validationReview',
  });

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
    [escalatedTests, filterState],
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
    [recollectionRequests, filterState, canResolveFromProvider],
  );

  const sectionLoading = useMinDisplay(dataLoading || (canViewEscalations && escalationLoading), 500);
  const hasRecollection = canResolveEscalation && filteredRecollectionRequests.length > 0;
  const hasEscalated = canViewEscalations && filteredEscalatedTests.length > 0;
  const hasValidation = filteredTests.length > 0;

  return (
    <ErrorBoundary>
      <SectionLoadingBoundary loading={sectionLoading} message="Loading validation..." size="lg">
        <LabWorkflowQueueScaffold
          filterRow={
            <LabQueueFilters
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
        >
          <ResultValidationQueueView
              isEmpty={!hasRecollection && !hasEscalated && !hasValidation}
              hasRecollection={hasRecollection}
              hasEscalated={hasEscalated}
              hasValidation={hasValidation}
              canResolveEscalation={canResolveEscalation}
              isMobile={isMobile}
              recollectionRequests={filteredRecollectionRequests}
              escalatedTests={filteredEscalatedTests}
              validationTests={filteredTests}
              comments={comments}
              pendingValidateKey={pendingValidateKey}
              isApprovingRecollection={isApprovingRecollection}
              isDenyingRecollection={isDenyingRecollection}
              isValidatePending={validateMutation.isPending}
              getCommentKey={getCommentKey}
              onApproveRecollection={handleApproveRecollection}
              onDenyRecollection={handleDenyRecollection}
              onOpenEscalation={openEscalationModal}
              onCommentsChange={handleCommentsChange}
              onApprove={(testId, orderId) => handleValidate(testId, orderId, true)}
              onReject={(test, result) => handleValidate(test.id!, test.orderId, false, result)}
              onOpenValidation={openValidationModal}
          />
        </LabWorkflowQueueScaffold>
      </SectionLoadingBoundary>
    </ErrorBoundary>
  );
};

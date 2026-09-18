/**
 * ResultValidationQueue - Result validation and supervisor exception review.
 */

import React, { useMemo } from 'react';
import { useAuthStore } from '@/app/authStore';
import { createLabQueueSearchFilter } from '../components/LabWorkflowQueueLayout';
import { LabQueueFilters } from '../components/LabQueueFilters';
import {
  applyLabQueueFilters,
  useLabQueueFilterState,
  useResultValidationQueueData,
  useLabQueueUrlSearch,
} from '@/features/lab/hooks';
import { validationFilterConfig } from '@/features/lab/constants';
import { ErrorBoundary } from '@/components';
import { WORKSPACE } from '@/components/theme/recipes';
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

function getOrderDate(t: TestWithContext & { orderDate?: string }) {
  return t.orderDate;
}
function getSampleType(t: TestWithContext) {
  return t.sampleType;
}
function getPriority(t: TestWithContext & { hasCriticalValues?: boolean }) {
  return t.priority as PriorityLevel;
}
function getQueueSince(t: TestWithContext) {
  return t.resultEnteredAt ?? t.orderDate;
}
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
  const urlSearch = useLabQueueUrlSearch();

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
        <div className="h-full flex flex-col min-h-0">
          <div className="shrink-0">
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
          </div>
          <div className={`flex-1 min-h-0 overflow-y-auto ${WORKSPACE.contentInset}`}>
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
          </div>
        </div>
      </SectionLoadingBoundary>
    </ErrorBoundary>
  );
};

/**
 * ResultValidationQueue - Result validation and supervisor exception review.
 */

import React, { useMemo, useState } from 'react';
import { useAuthStore } from '@/app/authStore';
import { createLabQueueSearchFilter, LabWorkflowQueueScaffold } from '../components/LabWorkflowQueueLayout';
import { LabQueueFilters } from '../components/LabQueueFilters';
import {
  applyLabQueueFilters,
  useLabQueueFilters,
  useResultValidationQueueData,
} from '../hooks';
import { validationFilterConfig } from '../constants';
import { DetailPageSkeleton } from '@/components/feedback/DetailPageSkeleton';
import { ErrorAlert, ErrorBoundary } from '@/components/feedback';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { LAB_CONFIG } from '../constants';
import { worklistServerFilters } from '../utils/labSearchAndLinks';
import { errorAlertMessage } from '@/utils/feedback';
import { LabQueueFilterRow } from '../components/LabQueueFilterRow';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [sampleTypeFilters, setSampleTypeFilters] = useState<string[]>([]);
  const debouncedSearch = useDebouncedValue(searchQuery, LAB_CONFIG.SEARCH_DEBOUNCE_MS);
  const serverFilters = worklistServerFilters({
    search: debouncedSearch,
    dateRange,
    sampleTypeFilters,
  });
  const {
    validationTests,
    escalations: escalatedTests,
    recollections: recollectionRequests,
    isLoading: dataLoading,
    isError: worklistError,
    error: worklistQueryError,
    refetch: refetchWorklist,
    pagination,
    goToPage,
    canResolveEscalation: canResolveFromProvider,
  } = useResultValidationQueueData(serverFilters);
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
    statusFilters: priorityFilters,
    setStatusFilters: setPriorityFilters,
    urlFilters,
    clearUrlFilters,
    setUrlFilter,
  } = useLabQueueFilters({
    items: allTests,
    workflowType: 'validationReview',
    searchQuery,
    onSearchChange: setSearchQuery,
    dateRange,
    onDateRangeChange: setDateRange,
    sampleTypeFilters,
    onSampleTypeFiltersChange: setSampleTypeFilters,
    skipSearchFilter: true,
    skipDateFilter: true,
    skipSampleTypeFilter: true,
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
        urlFilters,
        getId: test => test.id,
        getOrderId: test => test.orderId,
        getSampleId: test => test.sampleId,
      }),
    [escalatedTests, filterState, urlFilters],
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
        urlFilters,
        getId: request => request.orderTestId,
        getOrderId: request => request.orderId,
        getSampleId: request => request.rejectedSampleId,
      }),
    [recollectionRequests, filterState, canResolveFromProvider, urlFilters],
  );

  const hasNoWorklistData =
    validationTests.length === 0 &&
    escalatedTests.length === 0 &&
    recollectionRequests.length === 0;
  const waitingOnInitialLoad =
    hasNoWorklistData &&
    (dataLoading || (canViewEscalations && escalationLoading));

  if (worklistError) {
    return (
      <ErrorBoundary>
        <ErrorAlert
          error={{ message: errorAlertMessage('lab.worklist.loadFailed', worklistQueryError) }}
          onRetry={() => {
            void refetchWorklist();
          }}
        />
      </ErrorBoundary>
    );
  }

  if (waitingOnInitialLoad) {
    return (
      <ErrorBoundary>
        <DetailPageSkeleton variant="workflow-grid" />
      </ErrorBoundary>
    );
  }

  const hasRecollection = canResolveEscalation && filteredRecollectionRequests.length > 0;
  const hasEscalated = canViewEscalations && filteredEscalatedTests.length > 0;
  const hasValidation = filteredTests.length > 0;

  return (
    <ErrorBoundary>
        <LabWorkflowQueueScaffold
          aria-busy={dataLoading || undefined}
          filterRow={
            <LabQueueFilterRow
              urlFilters={urlFilters}
              onClearUrlFilters={clearUrlFilters}
              onClearUrlFilter={key => setUrlFilter(key, undefined)}
              pagination={pagination}
              onPageChange={goToPage}
            >
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
                statusFilterKey="priority"
              />
            </LabQueueFilterRow>
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
    </ErrorBoundary>
  );
};

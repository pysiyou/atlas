/**
 * ResultValidationQueue - Result validation and supervisor exception review.
 */

import React, { useMemo } from 'react';
import { useAuthStore } from '@/app/authStore';
import { LabWorkflowQueueMultiSectionLayout } from '../components/LabWorkflowQueueLayout';
import { LabQueueFilters } from '../components/LabQueueFilters';
import {
  applyLabQueueFiltersWithProfile,
  useLabQueueBarFilters,
  useLabQueueFilterBarProps,
  useLabQueuePageFilters,
  useResultValidationQueueData,
} from '../hooks';
import {
  VALIDATION_REVIEW_ESCALATION_PROFILE,
  VALIDATION_REVIEW_RECOLLECTION_PROFILE,
} from '../utils/labQueueSecondaryProfiles';
import { validationFilterConfig } from '../constants';
import { DetailPageSkeleton } from '@/components/feedback/DetailPageSkeleton';
import { ErrorAlert, ErrorBoundary } from '@/components/feedback';
import { useClientListChrome } from '@/hooks';
import { LabQueueFilterRow } from '../components/LabQueueFilterRow';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import type { TestWithContext } from '@/types';
import { useResultValidationWorkflow } from './useResultValidationWorkflow';
import { orderTestKey } from '../utils/labSearchAndLinks';
import { usePendingEscalation } from '../api/results';
import { ResultValidationQueueView } from './ResultValidationQueueView';
import { useResultValidationQueueActions } from './useResultValidationQueueActions';

function getCommentKey(test: TestWithContext) {
  return orderTestKey(test.id!);
}

export const ResultValidationQueue: React.FC = () => {
  const { hasRole } = useAuthStore();
  const canViewEscalations = hasRole(['administrator', 'lab-technician', 'lab-technician-plus']);
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);

  const bar = useLabQueueBarFilters('validationReview');
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
  } = useResultValidationQueueData(bar.serverFilters);
  const worklistChrome = useClientListChrome({
    loadFailedKey: 'lab.worklist.loadFailed',
    isLoading: dataLoading,
    isError: worklistError,
    error: worklistQueryError,
    refetch: refetchWorklist,
  });
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
    urlFilters,
    clearUrlFilters,
    setUrlFilter,
  } = useLabQueuePageFilters({
    items: allTests,
    workflowType: 'validationReview',
    bar,
  });
  const filterBarProps = useLabQueueFilterBarProps(bar, { statusFilterKey: 'priority' });

  const filteredEscalatedTests = useMemo(
    () =>
      applyLabQueueFiltersWithProfile(
        escalatedTests,
        filterState,
        bar,
        VALIDATION_REVIEW_ESCALATION_PROFILE,
      ),
    [escalatedTests, filterState, bar],
  );

  const filteredRecollectionRequests = useMemo(
    () =>
      applyLabQueueFiltersWithProfile(
        canResolveFromProvider ? recollectionRequests : [],
        filterState,
        bar,
        VALIDATION_REVIEW_RECOLLECTION_PROFILE,
      ),
    [recollectionRequests, filterState, bar, canResolveFromProvider],
  );

  const hasNoWorklistData =
    validationTests.length === 0 &&
    escalatedTests.length === 0 &&
    recollectionRequests.length === 0;
  const waitingOnInitialLoad =
    hasNoWorklistData &&
    (dataLoading || (canViewEscalations && escalationLoading));

  if (worklistChrome.error) {
    return (
      <ErrorBoundary>
        <ErrorAlert error={worklistChrome.error} onRetry={worklistChrome.onRetry} />
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
        <LabWorkflowQueueMultiSectionLayout
          aria-busy={dataLoading || undefined}
          filterRow={
            <LabQueueFilterRow
              urlFilters={urlFilters}
              onClearUrlFilters={clearUrlFilters}
              onClearUrlFilter={key => setUrlFilter(key, undefined)}
              pagination={pagination}
              onPageChange={goToPage}
            >
              <LabQueueFilters config={validationFilterConfig} {...filterBarProps} />
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
        </LabWorkflowQueueMultiSectionLayout>
    </ErrorBoundary>
  );
};

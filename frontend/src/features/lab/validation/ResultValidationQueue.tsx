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
import { VALIDATION_REVIEW_ESCALATION_PROFILE } from '../utils/labQueueSecondaryProfiles';
import { validationFilterConfig } from '../constants';
import { Card } from '@/components/surfaces';
import { SPACING } from '@/theme/recipes';
import { ErrorBoundary } from '@/components/feedback';
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
    isLoading: dataLoading,
    isError: worklistError,
    error: worklistQueryError,
    refetch: refetchWorklist,
    pagination,
    goToPage,
  } = useResultValidationQueueData(bar.serverFilters);
  useClientListChrome({
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

  const { openEscalationModal } = useResultValidationQueueActions({
    canResolveEscalation,
    invalidatePendingEscalation,
    refetchEscalation,
  });

  const { filteredItems: filteredTests, filterState } = useLabQueuePageFilters({
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

  const hasNoWorklistData = validationTests.length === 0 && escalatedTests.length === 0;
  const waitingOnInitialLoad =
    hasNoWorklistData && (dataLoading || (canViewEscalations && escalationLoading));

  const hasEscalated = canViewEscalations && filteredEscalatedTests.length > 0;
  const hasValidation = filteredTests.length > 0;

  return (
    <ErrorBoundary>
      <LabWorkflowQueueMultiSectionLayout
        aria-busy={dataLoading || waitingOnInitialLoad || undefined}
        filterRow={
          <LabQueueFilterRow pagination={pagination} onPageChange={goToPage}>
            <LabQueueFilters config={validationFilterConfig} {...filterBarProps} />
          </LabQueueFilterRow>
        }
      >
        {waitingOnInitialLoad ? (
          <div className={`flex flex-col ${SPACING.gapSection}`}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} padding="md" loading className="min-h-[140px]" />
            ))}
          </div>
        ) : (
          <ResultValidationQueueView
            isEmpty={!hasEscalated && !hasValidation}
            hasEscalated={hasEscalated}
            hasValidation={hasValidation}
            canResolveEscalation={canResolveEscalation}
            isMobile={isMobile}
            escalatedTests={filteredEscalatedTests}
            validationTests={filteredTests}
            comments={comments}
            pendingValidateKey={pendingValidateKey}
            isValidatePending={validateMutation.isPending}
            getCommentKey={getCommentKey}
            onOpenEscalation={openEscalationModal}
            onCommentsChange={handleCommentsChange}
            onApprove={(testId, orderId) => handleValidate(testId, orderId, true)}
            onReject={(test, result) => handleValidate(test.id!, test.orderId, false, result)}
            onOpenValidation={openValidationModal}
          />
        )}
      </LabWorkflowQueueMultiSectionLayout>
    </ErrorBoundary>
  );
};

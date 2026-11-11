/**
 * ResultValidationQueue - Result validation and supervisor exception review.
 */

import React, { useEffect, useMemo } from 'react';
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
import { FieldsPlaceholder, FIELDS_PLACEHOLDER_TABLE_INSET } from '@/components/surfaces/FieldsPlaceholder';
import { ErrorBoundary } from '@/components/feedback';
import { useClientListChrome } from '@/hooks';
import { LabQueueFilterRow } from '../components/LabQueueFilterRow';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import type { ValidationQueueRow } from '../types/validationQueue';
import { useResultValidationWorkflow } from './useResultValidationWorkflow';
import { useLabDraftStore } from '../state/labDraftStore';
import { orderTestKey } from '../utils/labSearchAndLinks';
import { usePendingEscalation } from '../api/results';
import { ResultValidationQueueView } from './ResultValidationQueueView';
import { useResultValidationQueueActions } from './useResultValidationQueueActions';

function getCommentKey(row: ValidationQueueRow) {
  return orderTestKey(row.orderTestId);
}

export const ResultValidationQueue: React.FC = () => {
  const { hasRole } = useAuthStore();
  const canViewEscalations = hasRole(['administrator', 'lab-technician', 'lab-technician-plus']);
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);

  const bar = useLabQueueBarFilters('validationReview');
  const {
    validationRows,
    escalations,
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

  useEffect(() => {
    const validationIds = validationRows.map(row => row.orderTestId);
    const escalationIds = escalations
      .map(item => item.id)
      .filter((id): id is number => id != null);
    const keepIds = [...validationIds, ...escalationIds];
    useLabDraftStore.getState().retainValidationDrafts(keepIds);
  }, [validationRows, escalations]);

  const { openEscalationModal } = useResultValidationQueueActions({
    canResolveEscalation,
    invalidatePendingEscalation,
    refetchEscalation,
  });

  const { filteredItems: filteredValidationRows, filterState } = useLabQueuePageFilters({
    items: validationRows,
    workflowType: 'validation',
    bar,
  });
  const filterBarProps = useLabQueueFilterBarProps(bar, { statusFilterKey: 'priority' });

  const filteredEscalations = useMemo(
    () =>
      applyLabQueueFiltersWithProfile(
        escalations,
        filterState,
        bar,
        VALIDATION_REVIEW_ESCALATION_PROFILE,
      ),
    [escalations, filterState, bar],
  );

  const hasNoWorklistData = validationRows.length === 0 && escalations.length === 0;
  const waitingOnInitialLoad =
    hasNoWorklistData && (dataLoading || (canViewEscalations && escalationLoading));

  const hasEscalated = canViewEscalations && filteredEscalations.length > 0;
  const hasValidation = filteredValidationRows.length > 0;

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
          <div className="flex-1 min-h-0">
            <FieldsPlaceholder className={FIELDS_PLACEHOLDER_TABLE_INSET} />
          </div>
        ) : (
          <ResultValidationQueueView
            isEmpty={!hasEscalated && !hasValidation}
            hasEscalated={hasEscalated}
            hasValidation={hasValidation}
            canResolveEscalation={canResolveEscalation}
            isMobile={isMobile}
            escalations={filteredEscalations}
            validationRows={filteredValidationRows as ValidationQueueRow[]}
            comments={comments}
            pendingValidateKey={pendingValidateKey}
            isValidatePending={validateMutation.isPending}
            getCommentKey={getCommentKey}
            onOpenEscalation={openEscalationModal}
            onCommentsChange={handleCommentsChange}
            onApprove={(testId, orderId) => handleValidate(testId, orderId, true)}
            onReject={(row, result) => handleValidate(row.orderTestId, row.orderId, false, result)}
            onOpenValidation={openValidationModal}
          />
        )}
      </LabWorkflowQueueMultiSectionLayout>
    </ErrorBoundary>
  );
};

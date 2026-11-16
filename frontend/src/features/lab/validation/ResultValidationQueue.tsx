/**
 * ResultValidationQueue — approve, reject (retest/recollect/cancel), or confirm criticals.
 */

import { useEffect, useMemo } from 'react';
import {
  LabWorkflowQueueMultiSectionLayout,
  QueueListPlaceholder,
} from '../components/LabWorkflowQueueLayout';
import { LabQueueFilters } from '../components/LabQueueFilters';
import {
  applyLabQueueFiltersWithProfile,
  type LabQueueFilterState,
  useLabQueueBarFilters,
  useLabQueueFilterBarProps,
  useResultValidationQueueData,
} from '../hooks';
import { VALIDATION_REVIEW_WORKLIST_PROFILE } from '../utils/labQueueSecondaryProfiles';
import type { PriorityLevel, SampleStatus, TestStatus } from '@/types';
import { getValidationFilterConfig } from '../constants';
import { useClientConfig } from '@/app/clientConfigContext';
import { ErrorBoundary } from '@/feedback';
import { useClientListChrome } from '@/hooks';
import { LabWorklistPaginationNotice } from '../components/LabWorklistPaginationNotice';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks';
import type { ValidationQueueRow } from '../types/queues';
import { useResultValidationWorkflow } from './useResultValidationWorkflow';
import { useLabDraftStore } from '../state/labDraftStore';
import { orderTestKey } from '../utils/labSearchAndLinks';
import { ResultValidationQueueView } from './ResultValidationQueueView';

function getCommentKey(row: ValidationQueueRow) {
  return orderTestKey(row.orderTestId);
}

export function ResultValidationQueue() {
  useClientConfig();
  const validationFilterConfig = getValidationFilterConfig();

  const bar = useLabQueueBarFilters('validationReview');
  const {
    validationRows,
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
    useLabDraftStore.getState().retainValidationDrafts(validationIds);
  }, [validationRows]);

  const filterBarProps = useLabQueueFilterBarProps(bar, { statusFilterKey: 'priority' });

  const filterState = useMemo<LabQueueFilterState<PriorityLevel | SampleStatus | TestStatus>>(
    () => ({
      searchQuery: bar.searchQuery,
      dateRange: bar.dateRange,
      sampleTypeFilters: bar.sampleTypeFilters,
      statusFilters: bar.statusFilters,
    }),
    [bar],
  );

  const filteredValidationRows = useMemo(
    () =>
      applyLabQueueFiltersWithProfile(
        validationRows,
        filterState,
        bar,
        VALIDATION_REVIEW_WORKLIST_PROFILE,
      ),
    [validationRows, filterState, bar],
  );

  const hasNoWorklistData = validationRows.length === 0;
  const waitingOnInitialLoad = hasNoWorklistData && dataLoading;
  const hasValidation = filteredValidationRows.length > 0;

  return (
    <ErrorBoundary>
      <LabWorkflowQueueMultiSectionLayout
        aria-busy={dataLoading || waitingOnInitialLoad || undefined}
        filterRow={<LabQueueFilters config={validationFilterConfig} {...filterBarProps} />}
        footer={<LabWorklistPaginationNotice pagination={pagination} onPageChange={goToPage} />}
      >
        {waitingOnInitialLoad ? (
          <QueueListPlaceholder />
        ) : (
          <ResultValidationQueueView
            isEmpty={!hasValidation}
            hasValidation={hasValidation}
            isMobile={isMobile}
            validationRows={filteredValidationRows}
            comments={comments}
            pendingValidateKey={pendingValidateKey}
            isValidatePending={validateMutation.isPending}
            getCommentKey={getCommentKey}
            onCommentsChange={handleCommentsChange}
            onApprove={(testId, orderId, criticalSeen) =>
              handleValidate(testId, orderId, true, undefined, criticalSeen)
            }
            onReject={(row, result) => handleValidate(row.orderTestId, row.orderId, false, result)}
            onOpenValidation={openValidationModal}
          />
        )}
      </LabWorkflowQueueMultiSectionLayout>
    </ErrorBoundary>
  );
}

/**
 * Result validation queue card — desktop/mobile shells, left header, data hooks.
 */
/* eslint-disable react-refresh/only-export-components -- queue card + colocated data hook */

import { useMemo, type FC } from 'react';
import { actionButtonPreset, Button } from '@/components/primitives';
import { Card } from '@/components/surfaces';
import { cn } from '@/utils';
import { useUserLookup } from '@/lib/api/users';
import { TestHeaderBadges } from '../components/LabWorkflowBadges';
import { QualityIssuePopover } from '../components';
import { ResultsParameterGrid } from '../components/ResultsParameterGrid';
import { SampleRejectedBanner } from '../components/SampleRejectedBanner';
import { useLabWorkflowCardClickGuard } from '../hooks';
import { isLabActionAllowed } from '../utils/queueDisplay';
import { useSampleRejectionDisplay } from '../hooks/useSampleRejectionDisplay';
import { useLabWorkflowResponsiveCard } from '../hooks/useLabWorkflowResponsiveCard';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import { MOBILE_LIST_CARD } from '@/theme/recipes';
import type { TestWithContext } from '@/types';
import type { QualityIssueResult } from '@/types/lab-operations';
import { QueueCard, QueueCardMobile } from './queueCardLayout';
import { TestWorkflowCardLeftColumn } from './queueCard.testWorkflowLeftColumn';

export interface ResultValidationCardProps {
  test: TestWithContext;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: () => void;
  onReject: (result: QualityIssueResult) => void;
  onClick: () => void;
  isApproving?: boolean;
  isMobile?: boolean;
}

export interface ResultValidationCardSharedData {
  test: TestWithContext;
  patientName: string;
  onApprove: () => void;
  onReject: ResultValidationCardProps['onReject'];
  isApproving: boolean;
  handleCardClick: () => void;
  getUserName: (id: string) => string;
  sampleRejection: ReturnType<typeof useSampleRejectionDisplay>;
  rejection: ReturnType<typeof deriveRetestContext>;
  canValidate: boolean;
  canReject: boolean;
}

export function useResultValidationCardData(
  props: ResultValidationCardProps
): ResultValidationCardSharedData | null {
  const { test, onApprove, onReject, onClick, isApproving = false } = props;
  const { getUserName } = useUserLookup();
  const handleCardClick = useLabWorkflowCardClickGuard(onClick);
  const canValidate = isLabActionAllowed(test.allowedActions, 'validate');
  const canReject = isLabActionAllowed(test.allowedActions, 'reject');
  const rejection = useMemo(() => deriveRetestContext(test), [test]);
  const sampleRejection = useSampleRejectionDisplay(test);

  if (!test.results) return null;

  return {
    test,
    patientName: test.patientName || '—',
    onApprove,
    onReject,
    isApproving,
    handleCardClick,
    getUserName,
    sampleRejection,
    rejection,
    canValidate,
    canReject,
  };
}

function useResultValidationCardHeader(test: TestWithContext, patientName: string) {
  const flagCount = test.flags?.length ?? 0;

  const leftColumn = useMemo(
    () => (
      <TestWorkflowCardLeftColumn
        test={test}
        patientName={patientName}
        variant="validation"
        queueSince={test.resultEnteredAt}
        emphasizeCritical
        flagCount={flagCount}
        includeResultEntered
      />
    ),
    [test, patientName, flagCount]
  );

  const badges = <TestHeaderBadges test={test} variant="validation" showStatus />;

  return { leftColumn, badges };
}

function ResultValidationCardDesktop({
  test,
  onApprove,
  onReject,
  isApproving,
  handleCardClick,
  sampleRejection,
  rejection,
  canValidate,
  canReject,
  patientName,
}: ResultValidationCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const { leftColumn, badges } = useResultValidationCardHeader(test, patientName);
  const { showBanner: isSampleRejected, sampleId, sampleRejectionReason } = sampleRejection;

  return (
    <QueueCard
      onClick={handleCardClick}
      className={showAttemptIndicator ? 'border-warning-stroke-emphasis' : ''}
      leftColumn={leftColumn}
      badges={badges}
      actionsPlacement="header"
      actions={
        <div className="flex items-center gap-space-2">
          <QualityIssuePopover
            orderTestId={test.id!}
            testCode={test.testCode}
            testName={test.testName}
            patientName={test.patientName}
            onReject={onReject}
            disabled={!canReject}
          />
          <Button
            {...actionButtonPreset('approve')}
            size="sm"
            title="Approve Results"
            isLoading={isApproving}
            disabled={!canValidate}
            onClick={e => {
              e.stopPropagation();
              onApprove();
            }}
          >
            Approve
          </Button>
        </div>
      }
      content={
        <>
          {isSampleRejected && (
            <div className="mb-space-3">
              <SampleRejectedBanner sampleId={sampleId} sampleRejectionReason={sampleRejectionReason} />
            </div>
          )}
          <ResultsParameterGrid
            results={test.results!}
            flags={test.flags}
            testCode={test.testCode}
            variant="inline"
            layout="compact"
          />
        </>
      }
      contentTitle="Results"
    />
  );
}

function ResultValidationCardMobile({
  test,
  patientName,
  onApprove,
  onReject,
  isApproving,
  handleCardClick,
  sampleRejection,
  rejection,
  canValidate,
  canReject,
}: ResultValidationCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const { leftColumn } = useResultValidationCardHeader(test, patientName);
  const { showBanner: isSampleRejected, sampleId, sampleRejectionReason } = sampleRejection;

  return (
    <Card
      padding="sm"
      hover
      className={cn(
        MOBILE_LIST_CARD.surface,
        showAttemptIndicator && 'border-warning-stroke-emphasis'
      )}
      onClick={handleCardClick}
    >
      {isSampleRejected && (
        <div className="mb-space-2">
          <SampleRejectedBanner
            sampleId={sampleId}
            sampleRejectionReason={sampleRejectionReason}
            size="compact"
          />
        </div>
      )}

      <QueueCardMobile
        leftColumn={leftColumn}
        badges={<TestHeaderBadges test={test} variant="validation" size="xs" showStatus />}
        actionsPlacement="header"
        actions={
          <>
            <QualityIssuePopover
              orderTestId={test.id!}
              testCode={test.testCode}
              testName={test.testName}
              patientName={patientName}
              onReject={onReject}
              disabled={!canReject}
            />
            <Button
              {...actionButtonPreset('approve')}
              size="sm"
              title="Approve Results"
              isLoading={isApproving}
              disabled={!canValidate}
              onClick={e => {
                e.stopPropagation();
                onApprove();
              }}
            >
              Approve
            </Button>
          </>
        }
      >
        <ResultsParameterGrid
          results={test.results!}
          flags={test.flags}
          testCode={test.testCode}
          variant="inline"
          layout="compact"
          dense
        />
      </QueueCardMobile>
    </Card>
  );
}

export const ResultValidationCard: FC<ResultValidationCardProps> = props => {
  const sharedData = useResultValidationCardData(props);

  const card = useLabWorkflowResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData as ResultValidationCardSharedData,
    renderMobile: ResultValidationCardMobile,
    renderDesktop: ResultValidationCardDesktop,
    isMobile: props.isMobile,
  });

  if (!sharedData) return null;

  return card;
};

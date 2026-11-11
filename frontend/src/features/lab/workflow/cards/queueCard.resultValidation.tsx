/**
 * Result validation queue card — desktop/mobile shells, left header, data hooks.
 */
/* eslint-disable react-refresh/only-export-components -- queue card + colocated data hook */

import { useMemo, type FC } from 'react';
import { actionButtonPreset, Button } from '@/components/primitives';
import { Card } from '@/components/surfaces';
import { cn } from '@/utils';
import { useUserLookup } from '@/lib/api/users';
import { TestHeaderBadges } from '../../components/LabWorkflowBadges';
import { QualityIssuePopover } from '../../components';
import { ResultsParameterGrid } from '../../components/ResultsParameterGrid';
import { SampleRejectedBanner } from '../../components/SampleRejectedBanner';
import { useLabWorkflowCardClickGuard } from '../../hooks';
import { isLabActionAllowed } from '../../utils/queueDisplay';
import { useSampleRejectionDisplay } from '../../hooks/useSampleRejectionDisplay';
import { useLabWorkflowResponsiveCard } from '../../hooks/useLabWorkflowResponsiveCard';
import type { ValidationQueueRow } from '../../types/queues';
import {
  labModalWorkItemFromDto,
  retestContextFromRow,
  type LabOrderTestQueueRow,
} from '../../types/labQueueChrome';
import type { QualityIssueResult } from '@/types/lab-operations';
import { QueueCard, QueueCardMobile } from '../shared/queueCardLayout';
import { TestWorkflowCardLeftColumn } from '../shared/queueCardLeftColumn';
import { MOBILE_LIST_CARD } from '@/theme/recipes';

export interface ResultValidationCardProps {
  row: ValidationQueueRow;
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
  row: ValidationQueueRow;
  chromeRow: LabOrderTestQueueRow;
  patientName: string;
  onApprove: () => void;
  onReject: ResultValidationCardProps['onReject'];
  isApproving: boolean;
  handleCardClick: () => void;
  getUserName: (id: string) => string;
  sampleRejection: ReturnType<typeof useSampleRejectionDisplay>;
  rejection: ReturnType<typeof retestContextFromRow>;
  canValidate: boolean;
  canReject: boolean;
}

export function useResultValidationCardData(
  props: ResultValidationCardProps
): ResultValidationCardSharedData | null {
  const { row, onApprove, onReject, onClick, isApproving = false } = props;
  const { getUserName } = useUserLookup();
  const handleCardClick = useLabWorkflowCardClickGuard(onClick);
  const chromeRow = useMemo(() => labModalWorkItemFromDto(row), [row]);
  const canValidate = isLabActionAllowed(row.allowedActions, 'validate');
  const canReject = isLabActionAllowed(row.allowedActions, 'reject');
  const rejection = useMemo(() => retestContextFromRow(chromeRow), [chromeRow]);
  const sampleRejection = useSampleRejectionDisplay(chromeRow);

  if (!row.results) return null;

  return {
    row,
    chromeRow,
    patientName: row.patientName || '—',
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

function useResultValidationCardHeader(chromeRow: LabOrderTestQueueRow, patientName: string) {
  const flagCount = chromeRow.flags?.length ?? 0;

  const leftColumn = useMemo(
    () => (
      <TestWorkflowCardLeftColumn
        row={chromeRow}
        patientName={patientName}
        variant="validation"
        queueSince={chromeRow.resultEnteredAt ?? undefined}
        emphasizeCritical
        flagCount={flagCount}
        includeResultEntered
      />
    ),
    [chromeRow, patientName, flagCount]
  );

  const badges = <TestHeaderBadges row={chromeRow} variant="validation" showStatus />;

  return { leftColumn, badges };
}

function ResultValidationCardDesktop({
  row,
  chromeRow,
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
  const { leftColumn, badges } = useResultValidationCardHeader(chromeRow, patientName);
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
            orderTestId={row.orderTestId}
            testCode={row.testCode}
            testName={row.testName}
            patientName={row.patientName}
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
            results={row.results!}
            flags={row.flags ?? undefined}
            testCode={row.testCode}
            variant="inline"
            layout="grid"
          />
        </>
      }
      contentTitle="Results"
    />
  );
}

function ResultValidationCardMobile({
  row,
  chromeRow,
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
  const { leftColumn } = useResultValidationCardHeader(chromeRow, patientName);
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
        badges={<TestHeaderBadges row={chromeRow} variant="validation" size="xs" showStatus />}
        actionsPlacement="header"
        actions={
          <>
            <QualityIssuePopover
              orderTestId={row.orderTestId}
              testCode={row.testCode}
              testName={row.testName}
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
          results={row.results!}
          flags={row.flags ?? undefined}
          testCode={row.testCode}
          variant="inline"
          layout="grid"
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

/**
 * Result validation queue card — desktop/mobile shells, left header, data hooks.
 */
/* eslint-disable react-refresh/only-export-components -- queue card + colocated data hook */

import { useMemo, useState, type FC } from 'react';
import { actionButtonPreset, Button } from '@/components/primitives';
import { Card } from '@/components/surfaces';
import { cn } from '@/utils';
import { useUserLookup } from '@/lib/api';
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
import type { QualityIssueResult } from '@/types';
import { QueueCard, QueueCardMobile } from '../shared/QueueCardLayout';
import { TestWorkflowCardLeftColumn } from '../shared/QueueCardLeftColumn';
import { MOBILE_LIST_CARD } from '@/theme/recipes';
import { useLabCopy } from '@/strings';
import { CriticalSeenConfirm } from '../../validation/CriticalSeenConfirm';

export interface ResultValidationCardProps {
  row: ValidationQueueRow;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: (criticalSeen?: boolean) => void;
  onReject: (result: QualityIssueResult) => void;
  onClick: () => void;
  isApproving?: boolean;
  isMobile?: boolean;
}

export interface ResultValidationCardSharedData {
  row: ValidationQueueRow;
  chromeRow: LabOrderTestQueueRow;
  patientName: string;
  onApprove: (criticalSeen?: boolean) => void;
  onReject: ResultValidationCardProps['onReject'];
  isApproving: boolean;
  handleCardClick: () => void;
  getUserName: (id: string) => string;
  sampleRejection: ReturnType<typeof useSampleRejectionDisplay>;
  rejection: ReturnType<typeof retestContextFromRow>;
  canValidate: boolean;
  canReject: boolean;
  hasCriticalValues: boolean;
  criticalSeen: boolean;
  setCriticalSeen: (checked: boolean) => void;
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
  const hasCriticalValues = Boolean(row.hasCriticalValues);
  const [criticalSeen, setCriticalSeen] = useState(false);

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
    hasCriticalValues,
    criticalSeen,
    setCriticalSeen,
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
  hasCriticalValues,
  criticalSeen,
  setCriticalSeen,
}: ResultValidationCardSharedData) {
  const labCopy = useLabCopy();
  const { showAttemptIndicator } = rejection;
  const { leftColumn, badges } = useResultValidationCardHeader(chromeRow, patientName);
  const { showBanner: isSampleRejected, sampleRejectionReason } = sampleRejection;
  const approveDisabled = !canValidate || (hasCriticalValues && !criticalSeen);

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
            title={labCopy.actions.approveResults}
            isLoading={isApproving}
            disabled={approveDisabled}
            onClick={e => {
              e.stopPropagation();
              onApprove(criticalSeen);
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
              <SampleRejectedBanner
                sampleId={sampleRejection.sampleId}
                sampleRejectionReason={sampleRejectionReason}
              />
            </div>
          )}
          {hasCriticalValues ? (
            <div
              className="mb-space-3"
              onClick={e => e.stopPropagation()}
              onKeyDown={e => e.stopPropagation()}
            >
              <CriticalSeenConfirm
                id={`critical-seen-${row.orderTestId}`}
                checked={criticalSeen}
                onChange={setCriticalSeen}
                disabled={isApproving}
              />
            </div>
          ) : null}
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
  hasCriticalValues,
  criticalSeen,
  setCriticalSeen,
}: ResultValidationCardSharedData) {
  const labCopy = useLabCopy();
  const { showAttemptIndicator } = rejection;
  const { leftColumn } = useResultValidationCardHeader(chromeRow, patientName);
  const { showBanner: isSampleRejected, sampleRejectionReason } = sampleRejection;
  const approveDisabled = !canValidate || (hasCriticalValues && !criticalSeen);

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
            sampleId={sampleRejection.sampleId}
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
              title={labCopy.actions.approveResults}
              isLoading={isApproving}
              disabled={approveDisabled}
              onClick={e => {
                e.stopPropagation();
                onApprove(criticalSeen);
              }}
            >
              Approve
            </Button>
          </>
        }
      >
        {hasCriticalValues ? (
          <div
            className="mb-space-2"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
          >
            <CriticalSeenConfirm
              id={`critical-seen-mobile-${row.orderTestId}`}
              checked={criticalSeen}
              onChange={setCriticalSeen}
              disabled={isApproving}
            />
          </div>
        ) : null}
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

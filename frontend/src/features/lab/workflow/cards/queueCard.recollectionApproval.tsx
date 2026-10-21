/**
 * Supervisor recollection approval queue card — desktop/mobile, left header, review body.
 */

import React, { type ReactNode, useCallback, useMemo, useState } from 'react';
import { Card } from '@/components/surfaces';
import { actionButtonPreset, Badge, Button } from '@/components/primitives';
import { RecordId } from '@/features/shared';
import { cn, formatDateTime } from '@/utils';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import type { RecollectionRequestSummary } from '@/types/lab-operations';
import { useLabWorkflowCardClickGuard } from '../../hooks';
import {
  text,
  RADIUS,
  MOBILE_LIST_CARD,
  WORKLIST_CARD_ALERT,
  WORKLIST_CARD_BADGE_SIZE,
  IDENTITY_INLINE,
  CARD_HEADER_GRID,
  IDENTITY_STACK,
  WORKLIST_EMPHASIZED_INLINE,
} from '@/theme/recipes';
import { compactAuditLines } from '../../constants/labWorkflowAuditLines';
import { LabAuditBlock } from '../../components/LabWorkflowHeader.parts';
import { LabCardMetaRow, QueueAgeMeta } from '../../components/LabCardMetaRow';
import { AttemptIndicator } from '../../components/LabAttemptIndicators';
import { SampleTypeBadge } from '../../components/LabDomainBadges';
import { SupervisorApprovalBadge } from '../../components/LabResultStatusBadges';
import { LAB_CONFIG } from '../../constants';
import { QueueCard, QueueCardMobile } from '../shared/queueCardLayout';

function InlineDot() {
  return <span className={IDENTITY_INLINE.separator}>{IDENTITY_INLINE.inlineDot}</span>;
}

function getTestCodesLabel(request: RecollectionRequestSummary): string {
  return request.testCodes.length === 1 ? request.testCodes[0] : request.testCodes.join(', ');
}

function RecollectionRequestCardLeftColumn({ request }: { request: RecollectionRequestSummary }) {
  const patientName = request.patientName ?? 'Unknown';
  const testCodesLabel = getTestCodesLabel(request);
  const attemptUsed = request.recollectionAttemptsUsed + 1;
  const max = LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS;
  const stageLabel = request.stage === 'validation' ? 'from validation' : 'from collection';

  const line1: ReactNode[] = [];
  line1.push(
    <span key="patient" className={cn(IDENTITY_INLINE.primaryText, 'min-w-0 truncate')}>
      {patientName}
    </span>,
  );
  line1.push(<InlineDot key="dot-sam" />);
  line1.push(
    <RecordId key="sam" type="sample" value={request.rejectedSampleId} className="whitespace-nowrap" />,
  );

  const line2: ReactNode[] = [];
  line2.push(
    <RecordId
      key="ord"
      type="order"
      value={request.orderId}
      emphasis="headerMuted"
      className="whitespace-nowrap"
    />,
  );
  if (testCodesLabel) {
    line2.push(<InlineDot key="dot-code" />);
    line2.push(
      <RecordId key="code" emphasis="headerMuted" className="whitespace-nowrap">
        {testCodesLabel}
      </RecordId>,
    );
  }

  const timelineLines = compactAuditLines({
    type: 'custom',
    content: (
      <>
        <span>Requested </span>
        <span className={WORKLIST_EMPHASIZED_INLINE}>{formatDateTime(request.createdAt)}</span>
        <span> · {stageLabel}</span>
      </>
    ),
  });

  return (
    <div className={CARD_HEADER_GRID.leftColumn}>
      <div className="flex min-w-0 flex-col gap-space-0-5">
        <div className={cn(IDENTITY_STACK.primaryLine, 'min-w-0')}>{line1}</div>
        {line2.length > 0 ? (
          <div className={cn(IDENTITY_STACK.secondaryLine, 'min-w-0')}>{line2}</div>
        ) : null}
      </div>
      <div className={WORKLIST_CARD_ALERT.row}>
        <LabCardMetaRow>
          <QueueAgeMeta since={request.createdAt} />
          <span>
            Attempt {attemptUsed}/{max}
          </span>
          {request.recollectionAttemptsRemaining >= 0 ? (
            <span>{request.recollectionAttemptsRemaining} remaining</span>
          ) : null}
          {request.requiresSupervisorOverride ? (
            <span className="text-warning-fg">Limit override</span>
          ) : null}
        </LabCardMetaRow>
      </div>
      <LabAuditBlock lines={timelineLines} compact tone="card" />
    </div>
  );
}

function RecollectionRequestBadges({ request }: { request: RecollectionRequestSummary }) {
  const attemptUsed = request.recollectionAttemptsUsed + 1;

  return (
    <>
      <SupervisorApprovalBadge size={WORKLIST_CARD_BADGE_SIZE} />
      {request.sampleType ? (
        <SampleTypeBadge sampleType={request.sampleType} size={WORKLIST_CARD_BADGE_SIZE} />
      ) : null}
      {request.requiresSupervisorOverride ? (
        <Badge variant="danger" size={WORKLIST_CARD_BADGE_SIZE}>Limit override</Badge>
      ) : null}
      <AttemptIndicator
        attemptNumber={attemptUsed}
        maxAttempts={LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS}
        type="recollection"
      />
    </>
  );
}

function RecollectionReviewBody({
  request,
  reviewNotes,
  onReviewNotesChange,
}: {
  request: RecollectionRequestSummary;
  reviewNotes: string;
  onReviewNotesChange: (value: string) => void;
}) {
  return (
    <div className={`space-y-space-1 ${text({ role: 'body' })}`}>
      <div>
        <span className={text({ role: 'label' })}>Reason:</span>{' '}
        <span className={text({ role: 'body' })}>{request.reason}</span>
      </div>
      {request.notes ? (
        <div>
          <span className={text({ role: 'label' })}>Notes:</span>{' '}
          <span className={text({ role: 'body' })}>{request.notes}</span>
        </div>
      ) : null}
      <textarea
        value={reviewNotes}
        onChange={e => onReviewNotesChange(e.target.value)}
        onClick={e => e.stopPropagation()}
        placeholder="Review notes (optional)"
        rows={2}
        className={`w-full ${RADIUS.field} border border-border-default bg-surface px-space-2 py-space-1 resize-none ${text({ role: 'body' })}`}
      />
    </div>
  );
}

function RecollectionRequestActions({
  request,
  reviewNotes,
  onApprove,
  onDeny,
  isApproving,
  isDenying,
}: {
  request: RecollectionRequestSummary;
  reviewNotes: string;
  onApprove: (requestId: number, reviewNotes?: string) => Promise<void>;
  onDeny: (requestId: number, reviewNotes?: string) => Promise<void>;
  isApproving?: boolean;
  isDenying?: boolean;
}) {
  return (
    <div className="flex items-center gap-space-2 z-10" onClick={e => e.stopPropagation()}>
      <Button
        {...actionButtonPreset('reject')}
        size="sm"
        layout="icon-text"
        isLoading={isDenying}
        disabled={isApproving}
        onClick={e => {
          e.stopPropagation();
          void onDeny(request.id, reviewNotes.trim() || undefined);
        }}
      >
        Deny
      </Button>
      <Button
        {...actionButtonPreset('approve')}
        size="sm"
        layout="icon-text"
        isLoading={isApproving}
        disabled={isDenying}
        onClick={e => {
          e.stopPropagation();
          void onApprove(request.id, reviewNotes.trim() || undefined);
        }}
      >
        Approve
      </Button>
    </div>
  );
}

export interface RecollectionRequestCardProps {
  request: RecollectionRequestSummary;
  onApprove: (requestId: number, reviewNotes?: string) => Promise<void>;
  onDeny: (requestId: number, reviewNotes?: string) => Promise<void>;
  isApproving?: boolean;
  isDenying?: boolean;
  isMobile?: boolean;
}

function RecollectionRequestCardDesktop({
  request,
  onApprove,
  onDeny,
  isApproving,
  isDenying,
  reviewNotes,
  onReviewNotesChange,
  onCardClick,
}: {
  request: RecollectionRequestSummary;
  onApprove: RecollectionRequestCardProps['onApprove'];
  onDeny: RecollectionRequestCardProps['onDeny'];
  isApproving?: boolean;
  isDenying?: boolean;
  reviewNotes: string;
  onReviewNotesChange: (value: string) => void;
  onCardClick: (e?: React.MouseEvent) => void;
}) {
  const leftColumn = useMemo(
    () => <RecollectionRequestCardLeftColumn request={request} />,
    [request]
  );

  return (
    <QueueCard
      onClick={onCardClick}
      className={request.requiresSupervisorOverride ? 'border-warning-stroke-emphasis' : ''}
      leftColumn={leftColumn}
      badges={<RecollectionRequestBadges request={request} />}
      actions={
        <RecollectionRequestActions
          request={request}
          reviewNotes={reviewNotes}
          onApprove={onApprove}
          onDeny={onDeny}
          isApproving={isApproving}
          isDenying={isDenying}
        />
      }
      actionsPlacement="header"
      content={
        <RecollectionReviewBody
          request={request}
          reviewNotes={reviewNotes}
          onReviewNotesChange={onReviewNotesChange}
        />
      }
      contentTitle="Recollection request"
    />
  );
}

function RecollectionRequestCardMobile({
  request,
  onApprove,
  onDeny,
  isApproving,
  isDenying,
  reviewNotes,
  onReviewNotesChange,
  onCardClick,
}: {
  request: RecollectionRequestSummary;
  onApprove: RecollectionRequestCardProps['onApprove'];
  onDeny: RecollectionRequestCardProps['onDeny'];
  isApproving?: boolean;
  isDenying?: boolean;
  reviewNotes: string;
  onReviewNotesChange: (value: string) => void;
  onCardClick: (e?: React.MouseEvent) => void;
}) {
  const leftColumn = useMemo(
    () => <RecollectionRequestCardLeftColumn request={request} />,
    [request]
  );

  return (
    <Card
      padding="sm"
      hover
      className={cn(
        MOBILE_LIST_CARD.surface,
        request.requiresSupervisorOverride && 'border-warning-stroke-emphasis'
      )}
      onClick={onCardClick}
    >
      <QueueCardMobile
        leftColumn={leftColumn}
        badges={<RecollectionRequestBadges request={request} />}
        actions={
          <RecollectionRequestActions
            request={request}
            reviewNotes={reviewNotes}
            onApprove={onApprove}
            onDeny={onDeny}
            isApproving={isApproving}
            isDenying={isDenying}
          />
        }
        actionsPlacement="header"
      >
        <div className={cn(MOBILE_LIST_CARD.body, 'space-y-space-0-5')}>
          <RecollectionReviewBody
            request={request}
            reviewNotes={reviewNotes}
            onReviewNotesChange={onReviewNotesChange}
          />
        </div>
      </QueueCardMobile>
    </Card>
  );
}

export const SampleRecollectionRequestCard: React.FC<RecollectionRequestCardProps> = ({
  request,
  onApprove,
  onDeny,
  isApproving = false,
  isDenying = false,
  isMobile = false,
}) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const { openModal } = useModal();

  const openRequestDetail = useCallback(() => {
    openModal({
      type: ModalType.SAMPLE_DETAIL,
      sampleId: String(request.rejectedSampleId),
      readOnly: true,
    });
  }, [openModal, request.rejectedSampleId]);

  const onCardClick = useLabWorkflowCardClickGuard(openRequestDetail);

  if (isMobile) {
    return (
      <RecollectionRequestCardMobile
        request={request}
        onApprove={onApprove}
        onDeny={onDeny}
        isApproving={isApproving}
        isDenying={isDenying}
        reviewNotes={reviewNotes}
        onReviewNotesChange={setReviewNotes}
        onCardClick={onCardClick}
      />
    );
  }

  return (
    <RecollectionRequestCardDesktop
      request={request}
      onApprove={onApprove}
      onDeny={onDeny}
      isApproving={isApproving}
      isDenying={isDenying}
      reviewNotes={reviewNotes}
      onReviewNotesChange={setReviewNotes}
      onCardClick={onCardClick}
    />
  );
};

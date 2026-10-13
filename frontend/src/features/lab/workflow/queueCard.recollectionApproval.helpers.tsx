/**
 * Recollection approval queue card — subcomponents and shared layout pieces.
 */

import { type ReactNode } from 'react';
import { RADIUS, TYPE } from '@/components/theme/recipes';
import { actionButtonPreset, Badge, Button, EntityId } from '@/components';
import { cn, formatDateTime } from '@/utils';
import { compactAuditLines } from '../constants/labWorkflowAuditLines';
import { LabAuditBlock } from '../components/LabWorkflowHeader.parts';
import { LabCardMetaRow, QueueAgeMeta } from '../components/LabCardMetaRow';
import { AttemptIndicator } from '../components/LabAttemptIndicators';
import { SampleTypeBadge } from '../components/LabDomainBadges';
import { SupervisorApprovalBadge } from '../components/LabResultStatusBadges';
import { LAB_CONFIG } from '../constants';
import type { RecollectionRequestSummary } from '@/types/lab-operations';
import {
  LAB_CARD_ALERT,
  LAB_CARD_BADGE_SIZE,
  LAB_CARD_CONTEXT,
  LAB_CARD_HEADER,
  LAB_CARD_QUEUE_IDENTITY,
  LAB_CARD_TYPOGRAPHY,
} from '../utils/labStyles';

function InlineDot() {
  return (
    <span className={LAB_CARD_CONTEXT.separator}>{LAB_CARD_CONTEXT.inlineDot}</span>
  );
}

function getTestCodesLabel(request: RecollectionRequestSummary): string {
  return request.testCodes.length === 1
    ? request.testCodes[0]
    : request.testCodes.join(', ');
}

export function RecollectionRequestCardLeftColumn({ request }: { request: RecollectionRequestSummary }) {
  const patientName = request.patientName ?? 'Unknown';
  const testCodesLabel = getTestCodesLabel(request);
  const attemptUsed = request.recollectionAttemptsUsed + 1;
  const max = LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS;
  const stageLabel = request.stage === 'validation' ? 'from validation' : 'from collection';

  const line1: ReactNode[] = [];
  line1.push(
    <span key="patient" className={cn(LAB_CARD_CONTEXT.patientName, 'min-w-0 truncate')}>
      {patientName}
    </span>
  );
  line1.push(<InlineDot key="dot-sam" />);
  line1.push(
    <EntityId key="sam" type="sample" value={request.rejectedSampleId} className="whitespace-nowrap" />
  );

  const line2: ReactNode[] = [];
  line2.push(
    <EntityId key="ord" type="order" value={request.orderId} variant="headerSecondary" className="whitespace-nowrap" />
  );
  if (testCodesLabel) {
    line2.push(<InlineDot key="dot-code" />);
    line2.push(
      <EntityId key="code" variant="headerSecondary" className="whitespace-nowrap">
        {testCodesLabel}
      </EntityId>
    );
  }

  const timelineLines = compactAuditLines({
    type: 'custom',
    content: (
      <>
        <span>Requested </span>
        <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>
          {formatDateTime(request.createdAt)}
        </span>
        <span> · {stageLabel}</span>
      </>
    ),
  });

  return (
    <div className={LAB_CARD_HEADER.leftColumn}>
      <div className="flex min-w-0 flex-col gap-space-0-5">
        <div className={cn(LAB_CARD_QUEUE_IDENTITY.primaryLine, 'min-w-0')}>{line1}</div>
        {line2.length > 0 ? (
          <div className={cn(LAB_CARD_QUEUE_IDENTITY.secondaryLine, 'min-w-0')}>{line2}</div>
        ) : null}
      </div>
      <div className={LAB_CARD_ALERT.row}>
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

export function RecollectionRequestBadges({ request }: { request: RecollectionRequestSummary }) {
  const attemptUsed = request.recollectionAttemptsUsed + 1;

  return (
    <>
      <SupervisorApprovalBadge size={LAB_CARD_BADGE_SIZE} />
      {request.sampleType ? (
        <SampleTypeBadge sampleType={request.sampleType} size={LAB_CARD_BADGE_SIZE} />
      ) : null}
      {request.requiresSupervisorOverride ? (
        <Badge variant="danger" size={LAB_CARD_BADGE_SIZE}>Limit override</Badge>
      ) : null}
      <AttemptIndicator
        attemptNumber={attemptUsed}
        maxAttempts={LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS}
        type="recollection"
      />
    </>
  );
}

export function RecollectionReviewBody({
  request,
  reviewNotes,
  onReviewNotesChange,
}: {
  request: RecollectionRequestSummary;
  reviewNotes: string;
  onReviewNotesChange: (value: string) => void;
}) {
  return (
    <div className={`space-y-space-1 ${TYPE.value}`}>
      <div>
        <span className={LAB_CARD_TYPOGRAPHY.fieldLabel}>Reason:</span>{' '}
        <span className={LAB_CARD_TYPOGRAPHY.fieldValue}>{request.reason}</span>
      </div>
      {request.notes ? (
        <div>
          <span className={LAB_CARD_TYPOGRAPHY.fieldLabel}>Notes:</span>{' '}
          <span className={LAB_CARD_TYPOGRAPHY.fieldValue}>{request.notes}</span>
        </div>
      ) : null}
      <textarea
        value={reviewNotes}
        onChange={e => onReviewNotesChange(e.target.value)}
        onClick={e => e.stopPropagation()}
        placeholder="Review notes (optional)"
        rows={2}
        className={`w-full ${RADIUS.field} border border-border-default bg-surface px-space-2 py-space-1 resize-none ${TYPE.value}`}
      />
    </div>
  );
}

export function RecollectionRequestActions({
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

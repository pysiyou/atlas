/**
 * RecollectionRequestCard — supervisor review for patient redraw approval.
 * Desktop uses LabCard; mobile matches EscalationCard / ValidationCard layout.
 */
import React, { useState } from 'react';
import { Badge, Button, Card } from '@/components';
import { cn, formatDateTime } from '@/utils';
import { LabCard } from '../components/LabCard';
import { compactAuditLines } from '../components/labHeader';
import {
  LabMobileCardHeader,
  labMobileCardSurfaceClassName,
} from '../components/labMobileCardHeader';
import { LAB_CARD_BADGE_SIZE, LAB_CARD_TYPOGRAPHY, LAB_MOBILE_CARD } from '../utils/labStyles';
import { AttemptIndicator } from '../components/AttemptIndicator';
import { BlockedReasonBadge } from '../components/StatusBadges';
import { LAB_CONFIG } from '@/features/lab/constants';
import type { RecollectionRequestSummary } from '@/types/lab-operations';

interface RecollectionRequestCardProps {
  request: RecollectionRequestSummary;
  onApprove: (requestId: number, reviewNotes?: string) => Promise<void>;
  onDeny: (requestId: number, reviewNotes?: string) => Promise<void>;
  isApproving?: boolean;
  isDenying?: boolean;
  isMobile?: boolean;
}

function getDisplayTitle(request: RecollectionRequestSummary): string {
  return request.testCodes.length === 1
    ? request.testCodes[0]
    : request.testCodes.join(', ');
}

function RecollectionRequestCardDesktop({
  request,
  onApprove,
  onDeny,
  isApproving,
  isDenying,
  reviewNotes,
  onReviewNotesChange,
}: {
  request: RecollectionRequestSummary;
  onApprove: (requestId: number, reviewNotes?: string) => Promise<void>;
  onDeny: (requestId: number, reviewNotes?: string) => Promise<void>;
  isApproving?: boolean;
  isDenying?: boolean;
  reviewNotes: string;
  onReviewNotesChange: (value: string) => void;
}) {
  const attemptUsed = request.recollectionAttemptsUsed + 1;
  const title = getDisplayTitle(request);

  const badges = (
    <>
      <BlockedReasonBadge label="Recollection approval" size={LAB_CARD_BADGE_SIZE} />
      {request.sampleType && (
        <Badge variant={request.sampleType as 'blood' | 'urine' | 'other'} size={LAB_CARD_BADGE_SIZE} />
      )}
      {request.requiresSupervisorOverride && (
        <Badge variant="danger" size={LAB_CARD_BADGE_SIZE}>Limit override</Badge>
      )}
      <AttemptIndicator
        attemptNumber={attemptUsed}
        maxAttempts={LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS}
        type="recollection"
      />
    </>
  );

  const actions = (
    <div className="flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
      <Button
        variant="danger"
        size="sm"
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
        variant="approve"
        size="sm"
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

  const additionalInfo = (
    <>
      Requested{' '}
      <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>{formatDateTime(request.createdAt)}</span>
      {request.stage === 'validation' ? ' · from validation' : ' · from collection'}
    </>
  );

  const content = (
    <div className="space-y-2 text-xs">
      <div>
        <span className={LAB_CARD_TYPOGRAPHY.fieldLabel}>Reason:</span>{' '}
        <span className={LAB_CARD_TYPOGRAPHY.fieldValue}>{request.reason}</span>
      </div>
      {request.notes && (
        <div>
          <span className={LAB_CARD_TYPOGRAPHY.fieldLabel}>Notes:</span>{' '}
          <span className={LAB_CARD_TYPOGRAPHY.fieldValue}>{request.notes}</span>
        </div>
      )}
      <textarea
        value={reviewNotes}
        onChange={e => onReviewNotesChange(e.target.value)}
        onClick={e => e.stopPropagation()}
        placeholder="Review notes (optional)"
        rows={2}
        className="w-full rounded border border-border-default bg-surface px-2 py-1.5 resize-none text-xs"
      />
    </div>
  );

  return (
    <LabCard
      className={request.requiresSupervisorOverride ? 'border-warning-stroke-emphasis' : ''}
      context={{
        patientName: request.patientName,
        patientId: request.patientId,
        orderId: request.orderId,
        sampleId: request.rejectedSampleId,
        entityCode: title,
      }}
      badges={badges}
      auditLines={compactAuditLines({
        type: 'custom',
        content: additionalInfo,
      })}
      actions={actions}
      content={content}
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
}: {
  request: RecollectionRequestSummary;
  onApprove: (requestId: number, reviewNotes?: string) => Promise<void>;
  onDeny: (requestId: number, reviewNotes?: string) => Promise<void>;
  isApproving?: boolean;
  isDenying?: boolean;
  reviewNotes: string;
  onReviewNotesChange: (value: string) => void;
}) {
  const title = getDisplayTitle(request);
  const attemptUsed = request.recollectionAttemptsUsed + 1;

  const badges = (
    <>
      <BlockedReasonBadge label="Recollection approval" size={LAB_CARD_BADGE_SIZE} />
      {request.sampleType && (
        <Badge variant={request.sampleType as 'blood' | 'urine' | 'other'} size={LAB_CARD_BADGE_SIZE} />
      )}
      {request.requiresSupervisorOverride && (
        <Badge variant="danger" size={LAB_CARD_BADGE_SIZE}>
          Limit override
        </Badge>
      )}
      <AttemptIndicator
        attemptNumber={attemptUsed}
        maxAttempts={LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS}
        type="recollection"
      />
    </>
  );

  const meta = (
    <>
      Requested{' '}
      <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>{formatDateTime(request.createdAt)}</span>
      {request.stage === 'validation' ? ' · from validation' : ' · from collection'}
    </>
  );

  const actions = (
    <>
      <Button
        variant="danger"
        size="sm"
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
        variant="approve"
        size="sm"
        isLoading={isApproving}
        disabled={isDenying}
        onClick={e => {
          e.stopPropagation();
          void onApprove(request.id, reviewNotes.trim() || undefined);
        }}
      >
        Approve
      </Button>
    </>
  );

  return (
    <Card
      padding="list"
      hover
      className={labMobileCardSurfaceClassName(
        request.requiresSupervisorOverride ? 'border-warning-stroke-emphasis' : undefined
      )}
    >
      <LabMobileCardHeader
        context={{
          patientName: request.patientName,
          patientId: request.patientId,
          orderId: request.orderId,
          sampleId: request.rejectedSampleId,
          entityCode: title,
        }}
        meta={<p className={LAB_MOBILE_CARD.metaLine}>{meta}</p>}
        badges={badges}
        actions={actions}
      >
        <div className={cn(LAB_MOBILE_CARD.body, 'space-y-1')}>
          <div>
            <span className={LAB_CARD_TYPOGRAPHY.fieldLabel}>Reason:</span>{' '}
            <span className={LAB_CARD_TYPOGRAPHY.fieldValue}>{request.reason}</span>
          </div>
          {request.notes && (
        <div>
          <span className={LAB_CARD_TYPOGRAPHY.fieldLabel}>Notes:</span>{' '}
          <span className={LAB_CARD_TYPOGRAPHY.fieldValue}>{request.notes}</span>
        </div>
      )}
        </div>
        <textarea
          value={reviewNotes}
          onChange={e => onReviewNotesChange(e.target.value)}
          onClick={e => e.stopPropagation()}
          placeholder="Review notes (optional)"
          rows={2}
          className="text-xs w-full rounded border border-border-default bg-surface px-2 py-1.5 resize-none"
        />
      </LabMobileCardHeader>
    </Card>
  );
}

export const RecollectionRequestCard: React.FC<RecollectionRequestCardProps> = ({
  request,
  onApprove,
  onDeny,
  isApproving = false,
  isDenying = false,
  isMobile = false,
}) => {
  const [reviewNotes, setReviewNotes] = useState('');

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
    />
  );
};

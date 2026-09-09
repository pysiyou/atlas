/**
 * RecollectionRequestCard — supervisor review for patient redraw approval.
 * Desktop uses LabCard; mobile matches EscalationCard / ValidationCard layout.
 */
import React, { useState } from 'react';
import { Badge, Button, Card } from '@/components';
import { formatDate, displayId } from '@/utils';
import { LabCard } from '../components/LabCard';
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
      <AttemptIndicator
        attemptNumber={attemptUsed}
        maxAttempts={LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS}
        type="recollection"
      />
      <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      <BlockedReasonBadge label="Recollection approval" size="sm" />
      {request.sampleType && (
        <Badge variant={request.sampleType as 'blood' | 'urine' | 'other'} size="sm" />
      )}
      {request.requiresSupervisorOverride && (
        <Badge variant="danger" size="sm">Limit override</Badge>
      )}
      <span className="entity-id">{displayId.sample(request.rejectedSampleId)}</span>
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
    <span className="text-xs text-text-tertiary">
      Requested <span className="text-text-secondary">{formatDate(request.createdAt)}</span>
      {request.stage === 'validation' ? ' · from result review' : ' · from collection'}
    </span>
  );

  const content = (
    <div className="space-y-2 text-xs text-text-secondary">
      <div>
        <span className="text-text-tertiary">Reason:</span>{' '}
        <span className="text-text-primary">{request.reason}</span>
      </div>
      {request.notes && <div className="text-text-tertiary">{request.notes}</div>}
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
        orderId: request.orderId,
      }}
      sampleInfo={{
        sampleId: request.rejectedSampleId,
      }}
      additionalInfo={additionalInfo}
      badges={badges}
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

  return (
    <Card padding="list" hover className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0 overflow-hidden">
          <div className="text-sm font-normal text-text-primary truncate">{title}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xs text-text-secondary font-normal truncate capitalize">
              {request.patientName}
            </div>
            <div className="text-xxs text-text-disabled">•</div>
            <div className="entity-id entity-id--secondary truncate">
              {displayId.order(request.orderId)}
            </div>
            <div className="text-xxs text-text-disabled">•</div>
            <div
              className="entity-id entity-id--secondary truncate"
              title={displayId.sample(request.rejectedSampleId)}
            >
              {displayId.sample(request.rejectedSampleId)}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1 mb-2">
        <div className="text-xs text-text-tertiary">
          Requested: {formatDate(request.createdAt)}
        </div>
        <div className="text-xs text-text-secondary">
          <span className="text-text-tertiary">Reason:</span> {request.reason}
        </div>
        {request.notes && <div className="text-xs text-text-tertiary">{request.notes}</div>}
      </div>

      <textarea
        value={reviewNotes}
        onChange={e => onReviewNotesChange(e.target.value)}
        placeholder="Review notes (optional)"
        rows={2}
        className="text-xs mb-2 w-full rounded border border-border-default bg-surface px-2 py-1.5 resize-none"
      />

      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border-subtle">
        <div className="flex items-center gap-2 flex-wrap">
          <BlockedReasonBadge label="Recollection approval" size="xs" />
          {request.sampleType && (
            <Badge variant={request.sampleType as 'blood' | 'urine' | 'other'} size="xs" />
          )}
          {request.requiresSupervisorOverride && (
            <Badge variant="danger" size="xs">Limit override</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
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
      </div>
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

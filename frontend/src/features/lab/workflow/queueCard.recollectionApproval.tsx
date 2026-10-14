/**
 * Supervisor recollection approval queue card — desktop/mobile, left header, review body.
 */

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/surfaces';
import { cn } from '@/utils';
import type { RecollectionRequestSummary } from '@/types/lab-operations';
import { LAB_MOBILE_CARD } from '../utils/labStyles';
import { QueueCard, QueueCardMobile } from './queueCardLayout';
import {
  RecollectionRequestActions,
  RecollectionRequestBadges,
  RecollectionRequestCardLeftColumn,
  RecollectionReviewBody,
} from './queueCard.recollectionApproval.helpers';

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
}: {
  request: RecollectionRequestSummary;
  onApprove: RecollectionRequestCardProps['onApprove'];
  onDeny: RecollectionRequestCardProps['onDeny'];
  isApproving?: boolean;
  isDenying?: boolean;
  reviewNotes: string;
  onReviewNotesChange: (value: string) => void;
}) {
  const leftColumn = useMemo(
    () => <RecollectionRequestCardLeftColumn request={request} />,
    [request]
  );

  return (
    <QueueCard
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
}: {
  request: RecollectionRequestSummary;
  onApprove: RecollectionRequestCardProps['onApprove'];
  onDeny: RecollectionRequestCardProps['onDeny'];
  isApproving?: boolean;
  isDenying?: boolean;
  reviewNotes: string;
  onReviewNotesChange: (value: string) => void;
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
        LAB_MOBILE_CARD.surface,
        request.requiresSupervisorOverride && 'border-warning-stroke-emphasis'
      )}
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
        <div className={cn(LAB_MOBILE_CARD.body, 'space-y-space-0-5')}>
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

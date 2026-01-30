/**
 * EscalationCard - Responsive card for escalated tests in the resolution queue.
 * Matches ValidationCard/EntryCard: same data, style, and responsive layout.
 * Click opens the escalation resolution modal (Force Validate / Authorize Re-test / Final Reject).
 */

import React from 'react';
import { Badge, Card, Button, Alert, Icon } from '@/shared/ui';
import { formatDate } from '@/utils';
import { displayId } from '@/utils';
import { useUserLookup } from '@/hooks/queries';
import { LabCard } from '../components/LabCard';
import type { TestWithContext } from '@/types';
import { ICONS } from '@/utils';

interface EscalationCardProps {
  test: TestWithContext;
  onClick: () => void;
  isMobile?: boolean;
}

export const EscalationCard: React.FC<EscalationCardProps> = ({
  test,
  onClick,
  isMobile = false,
}) => {
  const { getUserName } = useUserLookup();

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  const rejectionHistory = test.resultRejectionHistory ?? [];
  const lastRejection = rejectionHistory.at(-1) ?? null;
  const hasRejectionHistory = rejectionHistory.length > 0;
  const isRetest = test.isRetest === true;
  const isRecollection = lastRejection?.rejectionType === 're-collect';

  // Mobile layout (same structure as ValidationCard/EntryCard)
  if (isMobile) {
    return (
      <Card padding="list" hover className="flex flex-col h-full" onClick={handleCardClick}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0 overflow-hidden">
            <div className="text-sm font-medium text-text-primary truncate">
              {test.testName ?? test.testCode}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs text-text-secondary font-medium truncate">
                {test.patientName}
              </div>
              <div className="text-xxs text-text-disabled">•</div>
              <div className="text-xxs text-action-primary font-medium font-mono truncate">
                {test.testCode}
              </div>
              {test.sampleId && (
                <>
                  <div className="text-xs text-text-disabled">•</div>
                  <div
                    className="text-xxs text-action-primary font-medium font-mono truncate"
                    title={displayId.sample(test.sampleId)}
                  >
                    {displayId.sample(test.sampleId)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {test.collectedAt && (
            <div className="text-xs text-text-tertiary">
              Collected: {formatDate(test.collectedAt)}
            </div>
          )}
          {test.resultEnteredAt && (
            <div className="text-xs text-text-tertiary">
              Entered: {formatDate(test.resultEnteredAt)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            <Badge variant="escalated" size="xs" />
            {test.priority && <Badge variant={test.priority as 'routine' | 'urgent' | 'stat'} size="xs" />}
            {test.sampleType && <Badge variant={test.sampleType as 'blood' | 'urine' | 'other'} size="xs" />}
            {(isRetest || hasRejectionHistory) && (
              <Badge variant="warning" size="xs">
                RE-TEST
              </Badge>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Icon name={ICONS.actions.eye} className="text-action-primary-on" />}
            onClick={e => {
              e.stopPropagation();
              onClick();
            }}
          >
            View
          </Button>
        </div>
      </Card>
    );
  }

  // Desktop layout (LabCard - same structure as ValidationCard/EntryCard)
  const badges = (
    <>
      <h3 className="text-sm font-medium text-text-primary">{test.testName ?? test.testCode}</h3>
      <Badge variant="escalated" size="sm" />
      {test.priority && <Badge variant={test.priority as 'routine' | 'urgent' | 'stat'} size="sm" />}
      {test.sampleType && (
        <Badge variant={test.sampleType as 'blood' | 'urine' | 'other'} size="sm" />
      )}
      <span className="text-xs text-action-primary font-mono">{test.testCode}</span>
    </>
  );

  const actions = (
    <div className="flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
      <Button
        variant="primary"
        size="sm"
        icon={<Icon name={ICONS.actions.eye} className="text-action-primary-on" />}
        onClick={e => {
          e.stopPropagation();
          onClick();
        }}
      >
        View
      </Button>
    </div>
  );

  const additionalInfo = test.resultEnteredAt && (
    <span className="text-xs text-text-tertiary">
      Results entered <span className="text-text-secondary">{formatDate(test.resultEnteredAt)}</span>
      {test.enteredBy && <span> by {getUserName(test.enteredBy)}</span>}
    </span>
  );

  const showRetestBadge = isRetest && test.retestOfTestId;
  const showRecollectionBadge = isRecollection && !isRetest;
  const rejectionTrackingInfo =
    hasRejectionHistory && (showRetestBadge || showRecollectionBadge) ? (
      <div className="flex items-center gap-2 flex-wrap">
        {showRetestBadge && (
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Re-test of <span className="font-mono">{displayId.orderTest(test.retestOfTestId)}</span>
          </Badge>
        )}
        {showRecollectionBadge && (
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Recollection attempt #{rejectionHistory.length}
          </Badge>
        )}
      </div>
    ) : undefined;

  const recollectionBanner =
    hasRejectionHistory && lastRejection ? (
      <Alert variant="warning" className="py-2">
        <div className="space-y-0.5">
          <p className="font-medium text-xs">
            {isRetest
              ? `Re-test #${test.retestNumber ?? 0} - Previous Result Rejected`
              : `Re-collect #${rejectionHistory.length} - Previous Sample Rejected`}
          </p>
          <p className="text-xxs opacity-90 leading-tight">
            Reason: {lastRejection.rejectionReason}
          </p>
          {rejectionHistory.length > 1 && (
            <p className="text-xxs opacity-75">
              ({rejectionHistory.length} previous rejection
              {rejectionHistory.length > 1 ? 's' : ''})
            </p>
          )}
        </div>
      </Alert>
    ) : undefined;

  const content = (
    <div className="text-xs text-text-secondary">
      <span className="font-mono text-action-primary">{test.testCode}</span>
      {test.orderId != null && (
        <span className="ml-2">
          Order <span className="font-mono text-action-primary">{displayId.order(test.orderId)}</span>
        </span>
      )}
      {test.sampleId && (
        <span className="ml-2">
          Sample <span className="font-mono text-action-primary">{displayId.sample(test.sampleId)}</span>
        </span>
      )}
    </div>
  );

  return (
    <LabCard
      onClick={handleCardClick}
      className={hasRejectionHistory ? 'border-feedback-warning-border-strong' : ''}
      context={{
        patientName: test.patientName,
        orderId: test.orderId,
        referringPhysician: test.referringPhysician,
      }}
      sampleInfo={{
        sampleId: test.sampleId,
        collectedAt: test.collectedAt,
        collectedBy: test.collectedBy,
      }}
      additionalInfo={
        <>
          {additionalInfo}
          {rejectionTrackingInfo}
        </>
      }
      badges={badges}
      actions={actions}
      recollectionBanner={recollectionBanner}
      content={content}
      contentTitle="Details"
    />
  );
};

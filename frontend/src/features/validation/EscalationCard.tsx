/**
 * EscalationCard - Responsive card for escalated tests in the resolution queue.
 * Matches ValidationCard/EntryCard: same data, style, and responsive layout.
 * Click opens the escalation resolution modal (Force Validate / Authorize Re-test / Final Reject).
 */

import React from 'react';
import { Badge, Card, Button, Icon } from '@/components';
import { formatDate } from '@/utils';
import { displayId } from '@/utils';
import { useUserLookup } from '@/features/admin/api/useUsers';
import { LabCard } from '@/features/lab/components/LabCard';
import { AttemptIndicator } from '@/features/lab/components/AttemptIndicator';
import { useLabCardClickGuard } from '@/features/lab/hooks';
import { deriveTestRejectionContext } from '@/features/lab/utils/deriveTestRejectionContext';
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
  const handleCardClick = useLabCardClickGuard(onClick);

  const rejection = deriveTestRejectionContext(test);
  const {
    resultRejectionHistory: rejectionHistory,
    lastResultRejection: _lastRejection,
    hasResultRejectionHistory: hasRejectionHistory,
    isRetest,
    showRetestBadge,
    showRecollectionBadge,
    showAttemptIndicator,
    attemptNumber,
    attemptMax,
    attemptType,
    previousReason,
  } = rejection;

  // Mobile layout (same structure as ValidationCard/EntryCard)
  if (isMobile) {
    return (
      <Card padding="list" hover className="flex flex-col h-full" onClick={handleCardClick}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0 overflow-hidden">
            <div className="text-sm font-normal text-text-primary truncate">
              {test.testName ?? test.testCode}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs text-text-secondary font-normal truncate capitalize">
                {test.patientName}
              </div>
              <div className="text-xxs text-text-disabled">•</div>
              <div className="text-xxs text-brand font-normal font-mono truncate">
                {test.testCode}
              </div>
              {test.sampleId && (
                <>
                  <div className="text-xs text-text-disabled">•</div>
                  <div
                    className="text-xxs text-brand font-normal font-mono truncate"
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
            {test.priority && (
              <Badge variant={test.priority as 'low' | 'medium' | 'high' | 'urgent'} size="xs" />
            )}
            {test.sampleType && (
              <Badge variant={test.sampleType as 'blood' | 'urine' | 'other'} size="xs" />
            )}
            {(isRetest || hasRejectionHistory) && (
              <Badge variant="warning" size="xs">
                RE-TEST
              </Badge>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Icon name={ICONS.actions.eye} className="text-on-brand" />}
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
      {/* Attempt indicator for retests/recollections */}
      {showAttemptIndicator && (
        <AttemptIndicator
          attemptNumber={attemptNumber}
          maxAttempts={attemptMax}
          type={attemptType}
          previousReason={previousReason}
        />
      )}
      <h3 className="text-sm font-medium text-text-primary">{test.testName ?? test.testCode}</h3>
      <Badge variant="escalated" size="sm" />
      {test.priority && (
        <Badge variant={test.priority as 'low' | 'medium' | 'high' | 'urgent'} size="sm" />
      )}
      {test.sampleType && (
        <Badge variant={test.sampleType as 'blood' | 'urine' | 'other'} size="sm" />
      )}
      <span className="text-xs text-brand font-mono">{test.testCode}</span>
    </>
  );

  const actions = (
    <div className="flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
      <Button
        variant="primary"
        size="sm"
        icon={<Icon name={ICONS.actions.eye} className="text-on-brand" />}
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
      Results entered{' '}
      <span className="text-text-secondary">{formatDate(test.resultEnteredAt)}</span>
      {test.enteredBy && (
        <>
          {' '}
          by <span className="text-text-secondary">{getUserName(test.enteredBy)}</span>
        </>
      )}
    </span>
  );

  const rejectionTrackingInfo =
    hasRejectionHistory && (showRetestBadge || showRecollectionBadge) ? (
      <div className="flex items-center gap-2 flex-wrap">
        {showRetestBadge && (
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Re-test of <span className="font-mono text-brand">{displayId.orderTest(test.retestOfTestId)}</span>
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

  const content = (
    <div className="text-xs text-text-secondary">
      <span className="font-mono text-brand">{test.testCode}</span>
      {test.orderId != null && (
        <span className="ml-2">
          Order <span className="font-mono text-brand">{displayId.order(test.orderId)}</span>
        </span>
      )}
      {test.sampleId && (
        <span className="ml-2">
          Sample <span className="font-mono text-brand">{displayId.sample(test.sampleId)}</span>
        </span>
      )}
    </div>
  );

  return (
    <LabCard
      onClick={handleCardClick}
      className={hasRejectionHistory ? 'border-warning-stroke-emphasis' : ''}
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
      content={content}
      contentTitle="Details"
    />
  );
};

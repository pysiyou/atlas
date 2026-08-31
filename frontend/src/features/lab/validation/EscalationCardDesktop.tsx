import React from 'react';
import { Badge, Button, Icon } from '@/components';
import { formatDate, displayId } from '@/utils';
import { LabCard } from '@/features/lab/components/LabCard';
import { AttemptIndicator } from '@/features/lab/components/AttemptIndicator';
import type { TestWithContext } from '@/types';
import { ICONS } from '@/config/icons';

interface EscalationRejectionContext {
  resultRejectionHistory: { length: number };
  hasResultRejectionHistory: boolean;
  showRetestBadge: boolean;
  showRecollectionBadge: boolean;
  showAttemptIndicator: boolean;
  attemptNumber: number;
  attemptMax: number;
  attemptType: 'retest' | 'recollection';
  previousReason?: string;
}

interface EscalationCardDesktopProps {
  test: TestWithContext;
  onClick: () => void;
  handleCardClick: () => void;
  getUserName: (userId: number | string) => string;
  rejection: EscalationRejectionContext;
}

export const EscalationCardDesktop: React.FC<EscalationCardDesktopProps> = ({
  test,
  onClick,
  handleCardClick,
  getUserName,
  rejection,
}) => {
  const {
    resultRejectionHistory: rejectionHistory,
    hasResultRejectionHistory: hasRejectionHistory,
    showRetestBadge,
    showRecollectionBadge,
    showAttemptIndicator,
    attemptNumber,
    attemptMax,
    attemptType,
    previousReason,
  } = rejection;

  const badges = (
    <>
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
            Re-test of{' '}
            <span className="font-mono text-brand">{displayId.orderTest(test.retestOfTestId)}</span>
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

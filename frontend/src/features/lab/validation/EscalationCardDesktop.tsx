import React from 'react';
import { Badge, Button, Icon } from '@/components';
import { formatDate, displayId } from '@/utils';
import { LabCard } from '../components/LabCard';
import { AttemptIndicator } from '../components/AttemptIndicator';
import type { TestWithContext } from '@/types';
import type { TestRejectionContext } from '../utils/deriveTestRejectionContext';
import { ICONS } from '@/config/icons';

interface EscalationCardDesktopProps {
  test: TestWithContext;
  onClick: () => void;
  handleCardClick: () => void;
  getUserName: (userId: number | string) => string;
  rejection: TestRejectionContext;
}

export const EscalationCardDesktop: React.FC<EscalationCardDesktopProps> = ({
  test,
  onClick,
  handleCardClick,
  getUserName,
  rejection,
}) => {
  const {
    showRetestBadge,
    showRecollectionBadge,
    showAttemptIndicator,
    attemptNumber,
    attemptMax,
    attemptType,
    sampleRecollectionAttempt,
  } = rejection;

  const badges = (
    <>
      {showAttemptIndicator && (
        <AttemptIndicator
          attemptNumber={attemptNumber}
          maxAttempts={attemptMax}
          type={attemptType}
        />
      )}
      <h3 className="text-sm font-medium text-text-primary">{test.testName ?? test.testCode}</h3>
      <Badge variant="escalated" size="sm" />
      {test.reasonCode && (
        <Badge variant="warning" size="sm">
          {test.reasonCode}
        </Badge>
      )}
      {test.priority && (
        <Badge variant={test.priority as 'low' | 'medium' | 'high' | 'urgent'} size="sm" />
      )}
      {test.sampleType && (
        <Badge variant={test.sampleType as 'blood' | 'urine' | 'other'} size="sm" />
      )}
      <span className="entity-id">{test.testCode}</span>
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
    showAttemptIndicator && (showRetestBadge || showRecollectionBadge) ? (
      <div className="flex items-center gap-2 flex-wrap">
        {showRetestBadge && (
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Re-test of{' '}
            <span className="entity-id">{displayId.orderTest(test.retestOfTestId)}</span>
          </Badge>
        )}
        {showRecollectionBadge && (
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Recollection attempt #{sampleRecollectionAttempt}
          </Badge>
        )}
      </div>
    ) : undefined;

  const content = (
    <div className="text-xs text-text-secondary">
      <span className="entity-id">{test.testCode}</span>
      {test.orderId != null && (
        <span className="ml-2">
          Order <span className="entity-id">{displayId.order(test.orderId)}</span>
        </span>
      )}
      {test.sampleId && (
        <span className="ml-2">
          Sample <span className="entity-id">{displayId.sample(test.sampleId)}</span>
        </span>
      )}
    </div>
  );

  return (
    <LabCard
      onClick={handleCardClick}
      className={showAttemptIndicator ? 'border-warning-stroke-emphasis' : ''}
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

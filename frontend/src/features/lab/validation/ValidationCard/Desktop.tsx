/**
 * ValidationCardDesktop - Desktop layout for result validation workflow
 */

import React from 'react';
import { Badge, Button, Icon } from '@/components';
import { formatDate, displayId } from '@/utils';
import { LabCard } from '../../components/LabCard';
import { QualityIssueDialog } from '../../components';
import { AttemptIndicator } from '../../components/AttemptIndicator';
import { QueueAgeBadge } from '../../components/QueueAgeBadge';
import { BlockedReasonBadge } from '../../components/StatusBadges';
import { ResultsParameterGrid } from '../../components/ResultsParameterGrid';
import { SpecimenRejectedAlert } from './SpecimenRejectedAlert';
import { ICONS } from '@/config/icons';
import type { ValidationCardSharedData } from './hooks';

export const ValidationCardDesktop: React.FC<ValidationCardSharedData> = ({
  test,
  onApprove,
  onReject,
  isApproving,
  handleCardClick,
  getUserName,
  sampleRejectionReason,
  workItem,
  rejection,
}) => {
  const {
    showAttemptIndicator,
    showRetestBadge,
    showRecollectionBadge,
    attemptNumber,
    attemptMax,
    attemptType,
  } = rejection;
  
  const resultCount = Object.keys(test.results!).length;
  const isSpecimenRejected = workItem.blockedReason === 'sample_rejected';

  const badges = (
    <>
      {/* Attempt indicator in top corner */}
      {showAttemptIndicator && (
        <AttemptIndicator
          attemptNumber={attemptNumber}
          maxAttempts={attemptMax}
          type={attemptType}
          previousReason={undefined}
        />
      )}
      <h3 className="text-sm font-medium text-text-primary">{test.testName}</h3>
      {/* Merge priority and critical flags into single alert badge */}
      {test.hasCriticalValues ? (
        <Badge variant="danger" size="sm" className="flex items-center gap-1">
          <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
          CRITICAL
        </Badge>
      ) : test.priority === 'urgent' || test.priority === 'high' ? (
        <Badge variant={test.priority} size="sm" />
      ) : null}
      <Badge variant={test.sampleType} size="sm" />
      {test.resultEnteredAt && <QueueAgeBadge since={test.resultEnteredAt} />}
      {workItem.blockedReason && <BlockedReasonBadge label={workItem.label} size="sm" />}
    </>
  );

  const actions = (
    <div className="flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
      <QualityIssueDialog
        orderTestId={test.id!}
        testCode={test.testCode}
        testName={test.testName}
        patientName={test.patientName}
        onReject={onReject}
      />
      <Button
        variant="approve"
        size="sm"
        title="Approve Results"
        isLoading={isApproving}
        onClick={e => {
          e.stopPropagation();
          onApprove();
        }}
      >
        Approve
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
            Re-test of <span className="entity-id">{displayId.orderTest(test.retestOfTestId)}</span>
          </Badge>
        )}
        {showRecollectionBadge && (
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Recollection attempt #{attemptNumber}
          </Badge>
        )}
      </div>
    ) : undefined;

  return (
    <LabCard
      onClick={handleCardClick}
      className={showAttemptIndicator ? 'border-warning-stroke-emphasis' : ''}
      context={{
        patientName: test.patientName,
        orderId: test.orderId,
        orderTestId: test.id,
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
      content={
        <>
          {isSpecimenRejected && (
            <div className="mb-3">
              <SpecimenRejectedAlert
                sampleId={test.sampleId}
                sampleRejectionReason={sampleRejectionReason}
              />
            </div>
          )}
          <ResultsParameterGrid results={test.results!} flags={test.flags} variant="inline" />
        </>
      }
      contentTitle={`Results (${resultCount})`}
    />
  );
};

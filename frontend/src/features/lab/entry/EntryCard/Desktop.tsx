/**
 * EntryCardDesktop - Desktop layout for result entry workflow
 */

import React from 'react';
import { Badge, Icon } from '@/components';
import { displayId } from '@/utils';
import { LabCard, ProgressBadge } from '../../components/LabCard';
import { AttemptIndicator } from '../../components/AttemptIndicator';
import { QueueAgeBadge } from '../../components/QueueAgeBadge';
import { BlockedReasonBadge } from '../../components/StatusBadges';
import { LAB_CONFIG } from '../../constants';
import { ICONS } from '@/config/icons';
import type { EntryCardSharedData } from './hooks';

export const EntryCardDesktop: React.FC<EntryCardSharedData> = ({
  test,
  testDef,
  results,
  isComplete,
  parameterCount,
  filledCount,
  handleCardClick,
  workItem,
  rejection,
}) => {
  const { isRetest, retestNumber, isSampleRecollection, sampleRecollectionAttempt, showAttemptIndicator } = rejection;

  // Badges ordered by importance for result entry workflow
  const badges = (
    <>
      {/* Attempt indicator in top corner */}
      {(isRetest || isSampleRecollection) && (
        <AttemptIndicator
          attemptNumber={isRetest ? retestNumber : sampleRecollectionAttempt}
          maxAttempts={
            isRetest ? LAB_CONFIG.MAX_RETEST_ATTEMPTS : LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS
          }
          type={isRetest ? 'retest' : 'recollection'}
          previousReason={undefined}
        />
      )}
      <h3 className="text-sm font-medium text-text-primary">{test.testName}</h3>
      {(test.priority === 'urgent' || test.priority === 'high') && (
        <Badge variant={test.priority} size="sm" />
      )}
      <Badge variant={test.sampleType} size="sm" />
      {test.collectedAt && <QueueAgeBadge since={test.collectedAt} />}
      {workItem.blockedReason && <BlockedReasonBadge label={workItem.label} size="sm" />}
    </>
  );

  // Parameter progress badge
  const actions = (
    <ProgressBadge
      count={filledCount}
      total={parameterCount}
      label="PARAMS"
      isComplete={isComplete}
    />
  );

  // Parameter preview badges
  const content = (
    <div className="flex flex-wrap gap-1.5">
      {testDef.parameters && testDef.parameters.slice(0, LAB_CONFIG.PARAMETER_PREVIEW_LIMIT).map(param => (
        <Badge
          key={param.code}
          size="sm"
          uppercase={false}
          className={results[param.code] ? 'text-brand-fg' : 'text-text-tertiary'}
          variant={results[param.code] ? 'primary' : 'default'}
        >
          {param.name}
        </Badge>
      ))}
      {parameterCount > LAB_CONFIG.PARAMETER_PREVIEW_LIMIT && (
        <Badge size="sm" variant="default" className="text-text-tertiary">
          +{parameterCount - LAB_CONFIG.PARAMETER_PREVIEW_LIMIT} more
        </Badge>
      )}
    </div>
  );

  // Additional info for retest/recollection tracking
  const additionalInfo = (() => {
    if (isRetest && test.retestOfTestId) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Re-test of <span className="entity-id">{displayId.orderTest(test.retestOfTestId)}</span>
          </Badge>
        </div>
      );
    }
    if (isSampleRecollection && test.sampleOriginalSampleId) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Recollection of{' '}
            <span className="entity-id">
              {displayId.sample(test.sampleOriginalSampleId)}
            </span>
          </Badge>
        </div>
      );
    }
    return undefined;
  })();

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
      additionalInfo={additionalInfo}
      badges={badges}
      actions={actions}
      content={content}
      contentTitle={`Parameters (${parameterCount})`}
    />
  );
};

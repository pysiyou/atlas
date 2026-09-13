/**
 * CollectionCardDesktop - Desktop layout for sample collection workflow
 */

import React from 'react';
import { Badge, Icon, IconButton } from '@/components';
import Barcode from 'react-barcode';
import { CONTAINER_COLOR_OPTIONS, CONTAINER_CONFIG } from '@/types';
import { displayId } from '@/utils';
import { LabCard, TestList } from '../../components/LabCard';
import { AttemptIndicator } from '../../components/AttemptIndicator';
import { BlockedReasonBadge } from '../../components/StatusBadges';
import { QueueAgeBadge } from '../../components/QueueAgeBadge';
import { LAB_CONFIG } from '../../constants';
import { CollectionPopover } from '../CollectionPopover';
import { CollectionRejectionPopover } from '../CollectionRejectionPopover';
import { handlePrintCollectionLabel, getEffectiveContainerType } from '../../utils/labHelpers';
import { getCollectionRequirements, formatVolume, getContainerIconColor } from '../../utils';
import { ICONS, getContainerIcon } from '@/config/icons';
import type { CollectionCardSharedData } from './hooks';
import type { RejectedSample } from '@/types';

export const CollectionCardDesktop: React.FC<CollectionCardSharedData> = ({
  display,
  sample,
  requirement,
  onCollect,
  patientName,
  testNames,
  handleCardClick,
}) => {
  const { order } = display;
  const isPending = sample.status === 'pending';
  const isCollected = sample.status === 'collected';
  const isRejected = sample.status === 'rejected';
  const isRecollection = sample.isRecollection === true;
  const paymentBlocked = isPending && order.paymentStatus === 'unpaid';
  const rejectedSample = isRejected ? (sample as RejectedSample) : null;

  const hasContainerInfo = (isCollected || isRejected) && 'actualContainerColor' in sample;
  const containerColor = hasContainerInfo ? sample.actualContainerColor : undefined;
  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.label || 'N/A'
    : 'N/A';
  const containerType =
    hasContainerInfo && 'actualContainerType' in sample ? sample.actualContainerType : undefined;
  const effectiveContainerType = getEffectiveContainerType(containerType, sample.sampleType);
  const collectedVolume =
    (isCollected || isRejected) && 'collectedVolume' in sample ? sample.collectedVolume : undefined;
  const collectedAt =
    (isCollected || isRejected) && 'collectedAt' in sample ? sample.collectedAt : undefined;
  const collectedBy =
    (isCollected || isRejected) && 'collectedBy' in sample ? sample.collectedBy : undefined;

  const badges = (
    <>
      {/* Attempt indicator for recollections */}
      {isRecollection && (sample.recollectionAttempt ?? 1) > 1 && (
        <AttemptIndicator
          attemptNumber={sample.recollectionAttempt ?? 1}
          maxAttempts={LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS}
          type="recollection"
          previousReason={sample.recollectionReason}
        />
      )}
      <h3 className="text-sm font-medium text-text-primary capitalize">{patientName}</h3>
      {(sample.priority === 'urgent' || sample.priority === 'high') && (
        <Badge variant={sample.priority} size="sm" />
      )}
      <Badge variant={sample.sampleType} size="sm" />
      {isPending && <QueueAgeBadge since={order.orderDate} />}
      {paymentBlocked && <BlockedReasonBadge label="Payment required" size="sm" />}
      <Badge size="sm" variant="default" className="text-text-tertiary">
        {isPending
          ? `${formatVolume(requirement.totalVolume)} required`
          : `${formatVolume(collectedVolume!)} ${isRejected ? 'was collected' : 'collected'}`}
      </Badge>
      {(isCollected || isRejected) && containerColor && (
        <span
          className="flex items-center"
          title={`Container: ${CONTAINER_CONFIG[effectiveContainerType]?.label || effectiveContainerType}, Color: ${colorName}`}
        >
          <Icon
            name={getContainerIcon(effectiveContainerType)}
            className={`w-6 h-6 ${getContainerIconColor(containerColor)}`}
          />
        </span>
      )}
      {getCollectionRequirements(sample.sampleType).isDerived && (
        <Badge size="sm" variant="default" className="text-text-tertiary">
          {getCollectionRequirements(sample.sampleType).label}
        </Badge>
      )}
      {isCollected && sample.sampleId && (
        <div className="flex items-center">
          <Barcode
            value={displayId.sample(sample.sampleId)}
            height={15}
            displayValue={false}
            background="transparent"
            lineColor="var(--text)"
            margin={0}
          />
        </div>
      )}
    </>
  );

  const actions = (
    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
      {isPending ? (
        <CollectionPopover
          requirement={requirement}
          patientName={patientName}
          testName={testNames.join(', ')}
          isRecollection={isRecollection}
          onConfirm={(volume, notes, color, containerType) =>
            onCollect(display, volume, notes, color, containerType)
          }
        />
      ) : isRejected ? (
        <Badge size="sm" variant="rejected" />
      ) : (
        <>
          <Badge size="sm" variant="collected" />
          {sample.sampleId && (
            <>
              <CollectionRejectionPopover
                sampleId={sample.sampleId.toString()}
                testCodes={sample.testCodes ?? []}
                sampleType={sample.sampleType}
                patientName={patientName}
                isRecollection={isRecollection}
              />
              <IconButton
                onClick={() => handlePrintCollectionLabel(display, patientName)}
                variant="print"
                size="sm"
                title="Print Sample Label"
              />
            </>
          )}
        </>
      )}
    </div>
  );

  const additionalInfo =
    (isRecollection && sample.originalSampleId) || rejectedSample?.recollectionSampleId ? (
      <div className="flex items-center gap-2 flex-wrap">
        {isRecollection && sample.originalSampleId && (
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Recollection of{' '}
            <span className="entity-id">
              {displayId.sample(sample.originalSampleId)}
            </span>
          </Badge>
        )}
        {rejectedSample?.recollectionSampleId && (
          <Badge size="sm" variant="info" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Recollection requested:{' '}
            <span className="entity-id">
              {displayId.sample(rejectedSample.recollectionSampleId)}
            </span>
          </Badge>
        )}
      </div>
    ) : undefined;

  return (
    <LabCard
      onClick={handleCardClick}
      className={isRejected ? 'border-warning-stroke-emphasis' : ''}
      context={{
        orderId: order.orderId,
        referringPhysician: order.referringPhysician,
      }}
      sampleInfo={
        (isCollected || isRejected) && sample.sampleId
          ? { sampleId: sample.sampleId, collectedAt, collectedBy }
          : undefined
      }
      additionalInfo={additionalInfo}
      badges={badges}
      actions={actions}
      content={
        <TestList
          tests={testNames.map((name, i) => ({ name, code: requirement.testCodes[i] || '' }))}
        />
      }
      contentTitle="Required for"
    />
  );
};

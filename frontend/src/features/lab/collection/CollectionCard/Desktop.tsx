/**
 * CollectionCardDesktop - Desktop layout for sample collection workflow
 */

import React from 'react';
import { IconButton } from '@/components';
import { LabCard, TestList } from '../../components/LabCard';
import { CollectionHeaderBadges } from '../../components/labWorkflowBadges';
import { collectionHeaderAudit } from '../../components/labHeader';
import { CollectionPopover } from '../CollectionPopover';
import { CollectionRejectionPopover } from '../CollectionRejectionPopover';
import { handlePrintCollectionLabel, getEffectiveContainerType } from '../../utils/labHelpers';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
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
    <CollectionHeaderBadges
      sample={sample}
      isPending={isPending}
      isCollected={isCollected}
      isRejected={isRejected}
      rejectedSample={rejectedSample}
      orderDate={order.orderDate}
      paymentBlocked={paymentBlocked}
      requiredVolume={requirement.totalVolume}
      collectedVolume={collectedVolume}
      containerColor={containerColor}
      effectiveContainerType={effectiveContainerType}
      colorName={colorName}
      showBarcode={isCollected && !!sample.sampleId}
    />
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
      ) : isCollected && sample.sampleId ? (
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
      ) : null}
    </div>
  );

  return (
    <LabCard
      onClick={handleCardClick}
      className={isRejected ? 'border-warning-stroke-emphasis' : ''}
      context={{
        patientName,
        patientId: display.order.patientId,
        orderId: order.orderId,
        sampleId: sample.sampleId,
        entityCode: sample.sampleType.toUpperCase(),
        referringPhysician: order.referringPhysician,
      }}
      auditLines={collectionHeaderAudit({
        sampleId: sample.sampleId,
        collectedAt,
        collectedBy,
        isRecollection,
        originalSampleId: sample.originalSampleId,
        originalSampleCollectedAt: sample.originalSampleCollectedAt,
      })}
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

/**
 * CollectionCardMobile - Mobile layout for sample collection workflow
 */

import React from 'react';
import { Badge, Card, IconButton } from '@/components';
import { CollectionHeaderBadges } from '../../components/labWorkflowBadges';
import { collectionHeaderAudit } from '../../components/labHeader';
import { LabMobileCardHeader, labMobileCardSurfaceClassName } from '../../components/labMobileCardHeader';
import { LAB_MOBILE_CARD } from '../../utils/labStyles';
import { CollectionPopover } from '../CollectionPopover';
import { getEffectiveContainerType } from '../../utils/labHelpers';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import type { CollectionCardSharedData } from './hooks';
import type { RejectedSample } from '@/types';

export const CollectionCardMobile: React.FC<CollectionCardSharedData> = ({
  display,
  sample,
  requirement,
  onCollect,
  patientName,
  testNames,
  handleCardClick,
  isCollecting,
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
  const testCount = testNames.length;

  const statusAside = isPending ? (
    <Badge variant="pending" size="xs" />
  ) : isCollected ? (
    <Badge variant="collected" size="xs" />
  ) : isRejected ? (
    <Badge variant="rejected" size="xs" />
  ) : null;

  const actions = isPending ? (
    <CollectionPopover
      requirement={requirement}
      patientName={patientName}
      testName={testNames.join(', ')}
      isRecollection={isRecollection}
      onConfirm={(volume, notes, color, containerType) =>
        onCollect(display, volume, notes, color, containerType)
      }
      isSubmitting={isCollecting}
    />
  ) : (
    <IconButton
      variant="view"
      size="sm"
      title="View Details"
      onClick={e => {
        e.stopPropagation();
        handleCardClick();
      }}
    />
  );

  return (
    <Card
      padding="list"
      hover
      className={labMobileCardSurfaceClassName()}
      onClick={() => handleCardClick()}
    >
      <LabMobileCardHeader
        context={{
          patientName,
          patientId: display.order.patientId,
          orderId: order.orderId,
          sampleId: sample.sampleId,
          entityCode: sample.sampleType.toUpperCase(),
        }}
        titleAside={statusAside}
        auditLines={collectionHeaderAudit({
          sampleId: sample.sampleId,
          collectedAt,
          collectedBy,
          isRecollection,
          originalSampleId: sample.originalSampleId,
          originalSampleCollectedAt: sample.originalSampleCollectedAt,
        })}
        badges={
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
            size="xs"
          />
        }
        actions={actions}
      >
        <p className={LAB_MOBILE_CARD.body}>
          {testCount} test{testCount !== 1 ? 's' : ''}: {testNames.slice(0, 2).join(', ')}
          {testCount > 2 && ` +${testCount - 2} more`}
        </p>
      </LabMobileCardHeader>
    </Card>
  );
};

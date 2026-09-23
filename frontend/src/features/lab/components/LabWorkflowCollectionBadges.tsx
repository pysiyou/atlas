import React from 'react';
import { Badge, Icon, EntityId } from '@/components';
import type { BadgeSize } from '@/components';
import Barcode from 'react-barcode';
import type { ContainerType, ContainerTopColor, Sample, RejectedSample } from '@/types';
import { CONTAINER_CONFIG } from '@/types';
import { displayId } from '@/utils';
import {
  formatVolume,
  getCollectionRequirements,
  getContainerIconColor,
} from '@/features/lab/utils';
import { getContainerIcon, ICONS } from '@/config/icons';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';
import {
  LabPriorityBadge,
  SampleStatusBadge,
  SampleTypeBadge,
} from './LabDomainBadges';
import { QueueAgeBadge } from './QueueAgeBadge';
import { BlockedReasonBadge } from './LabResultStatusBadges';
import { LabRejectionTailBadgesFromSample } from './LabRejectionTailBadges';
import { CompactMd, CompactOnly } from './LabWorkflowBadgeChrome';

export interface CollectionHeaderBadgesProps {
  sample: Sample;
  isPending: boolean;
  isCollected: boolean;
  isRejected: boolean;
  rejectedSample?: RejectedSample | null;
  orderDate?: string;
  paymentBlocked?: boolean;
  requiredVolume?: number;
  collectedVolume?: number;
  containerColor?: ContainerTopColor | string;
  effectiveContainerType?: ContainerType;
  colorName?: string;
  size?: BadgeSize;
  showBarcode?: boolean;
  containerIconClassName?: string;
}

function CollectionVolumeBadges({
  isPending,
  isCollected,
  isRejected,
  required,
  collectedVolume,
  size,
}: {
  isPending: boolean;
  isCollected: boolean;
  isRejected: boolean;
  required?: number;
  collectedVolume?: number;
  size: BadgeSize;
}) {
  return (
    <>
      {isPending && required != null && (
        <CompactOnly>
          <Badge size={size} variant="neutral" className="text-text-tertiary">
            {formatVolume(required)} required
          </Badge>
        </CompactOnly>
      )}
      {(isCollected || isRejected) && collectedVolume != null && (
        <CompactOnly>
          <Badge size={size} variant="neutral" className="text-text-tertiary">
            {formatVolume(collectedVolume)} {isRejected ? 'was collected' : 'collected'}
          </Badge>
        </CompactOnly>
      )}
      {(isCollected || isRejected) && required != null && (
        <CompactOnly>
          <Badge size={size} variant="neutral" className="text-text-tertiary">
            {formatVolume(required)} required
          </Badge>
        </CompactOnly>
      )}
    </>
  );
}

function CollectionContainerBadges({
  hasContainer,
  effectiveContainerType,
  containerColor,
  colorName,
  containerIconClassName,
  sampleType,
  size,
}: {
  hasContainer: boolean;
  effectiveContainerType?: ContainerType;
  containerColor?: ContainerTopColor | string;
  colorName: string;
  containerIconClassName: string;
  sampleType: Sample['sampleType'];
  size: BadgeSize;
}) {
  const derived = getCollectionRequirements(sampleType);
  return (
    <>
      {hasContainer && (
        <CompactOnly className="hidden lg:inline-flex items-center">
          <span
            className="flex items-center"
            title={`Container: ${CONTAINER_CONFIG[effectiveContainerType!]?.label || effectiveContainerType}, Color: ${colorName}`}
          >
            <Icon
              name={getContainerIcon(effectiveContainerType!)}
              className={`${containerIconClassName} ${getContainerIconColor(containerColor as ContainerTopColor)}`}
            />
          </span>
        </CompactOnly>
      )}
      {derived.isDerived && (
        <CompactOnly>
          <Badge size={size} variant="neutral" className="text-text-tertiary">
            {derived.label}
          </Badge>
        </CompactOnly>
      )}
    </>
  );
}

function CollectionStatusExtras({
  sample,
  isCollected,
  isRejected,
  rejectedSample,
  showBarcode,
  size,
}: {
  sample: Sample;
  isCollected: boolean;
  isRejected: boolean;
  rejectedSample?: RejectedSample | null;
  showBarcode: boolean;
  size: BadgeSize;
}) {
  return (
    <>
      {isRejected && rejectedSample?.recollectionSampleId && (
        <CompactOnly>
          <Badge size={size} variant="info" className="flex items-center gap-space-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Recollection requested:{' '}
            <EntityId type="sample" value={rejectedSample.recollectionSampleId} />
          </Badge>
        </CompactOnly>
      )}
      {showBarcode && isCollected && sample.sampleId && (
        <CompactOnly className="hidden lg:inline-flex items-center">
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
        </CompactOnly>
      )}
      <LabRejectionTailBadgesFromSample sample={sample} size={size} />
    </>
  );
}

function compactBadgeSize(size: BadgeSize): 'xs' | 'sm' {
  return size === 'md' ? 'sm' : size;
}

export const CollectionHeaderBadges = React.memo(({
  sample,
  isPending,
  isCollected,
  isRejected,
  rejectedSample = null,
  orderDate,
  paymentBlocked = false,
  requiredVolume,
  collectedVolume,
  containerColor,
  effectiveContainerType,
  colorName = 'N/A',
  size = LAB_CARD_BADGE_SIZE,
  showBarcode = false,
  containerIconClassName = 'w-6 h-6',
}: CollectionHeaderBadgesProps) => {
  const priority = sample.priority;
  const showPriority = priority === 'urgent' || priority === 'high';
  const hasContainer = (isCollected || isRejected) && Boolean(containerColor && effectiveContainerType);
  const required = requiredVolume ?? sample.requiredVolume;
  const compactSize = compactBadgeSize(size);

  return (
    <>
      {showPriority && priority && <LabPriorityBadge priority={priority} size={size} />}
      <SampleTypeBadge sampleType={sample.sampleType} size={size} />
      {isPending && orderDate && (
        <CompactMd>
          <QueueAgeBadge since={orderDate} />
        </CompactMd>
      )}
      {paymentBlocked && <BlockedReasonBadge label="Payment required" size={compactSize} />}
      <CollectionVolumeBadges
        isPending={isPending}
        isCollected={isCollected}
        isRejected={isRejected}
        required={required}
        collectedVolume={collectedVolume}
        size={size}
      />
      <CollectionContainerBadges
        hasContainer={hasContainer}
        effectiveContainerType={effectiveContainerType}
        containerColor={containerColor}
        colorName={colorName}
        containerIconClassName={containerIconClassName}
        sampleType={sample.sampleType}
        size={size}
      />
      <SampleStatusBadge
        status={isPending ? 'pending' : isRejected ? 'rejected' : 'collected'}
        size={size}
      />
      <CollectionStatusExtras
        sample={sample}
        isCollected={isCollected}
        isRejected={isRejected}
        rejectedSample={rejectedSample}
        showBarcode={showBarcode}
        size={size}
      />
    </>
  );
});

import React from 'react';
import type { BadgeSize } from '@/components';
import type { ContainerType, ContainerTopColor, Sample, RejectedSample } from '@/types';
import { CONTAINER_CONFIG } from '@/types';
import {
  formatVolume,
  getCollectionRequirements,
} from '../utils';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';
import {
  LabPriorityBadge,
  SampleStatusBadge,
  SampleTypeBadge,
} from './LabDomainBadges';
import { StatusPresentationStack } from '@/components/display/StatusPresentationBadge';
import type { StatusPresentation } from '@/types/labProjection';
import {
  LabCardMetaRow,
  QueueAgeMeta,
  RecollectionRequestedMeta,
  SampleRejectionTailMeta,
} from './LabCardMetaRow';

export interface CollectionHeaderBadgesProps {
  sample: Sample;
  isPending: boolean;
  isCollected: boolean;
  isRejected: boolean;
  statusPresentation?: StatusPresentation | null;
  size?: BadgeSize;
}

/** Enum/status chips only — sample type, priority, workflow status. */
export const CollectionHeaderBadges = React.memo(({
  sample,
  isPending,
  isRejected,
  statusPresentation = null,
  size = LAB_CARD_BADGE_SIZE,
}: CollectionHeaderBadgesProps) => {
  const priority = sample.priority;
  const showPriority = priority === 'urgent' || priority === 'high';

  return (
    <>
      {showPriority && priority ? <LabPriorityBadge priority={priority} size={size} /> : null}
      <SampleTypeBadge sampleType={sample.sampleType} size={size} />
      {statusPresentation ? (
        <StatusPresentationStack presentation={statusPresentation} size={size} />
      ) : (
        <SampleStatusBadge
          status={isPending ? 'pending' : isRejected ? 'rejected' : 'collected'}
          size={size}
        />
      )}
    </>
  );
});

export interface CollectionCardMetaProps {
  sample: Sample;
  isPending: boolean;
  isCollected: boolean;
  isRejected: boolean;
  rejectedSample?: RejectedSample | null;
  orderDate?: string;
  requiredVolume?: number;
  collectedVolume?: number;
  effectiveContainerType?: ContainerType;
  containerColor?: ContainerTopColor | string;
  colorName?: string;
}

export const CollectionCardMeta: React.FC<CollectionCardMetaProps> = ({
  sample,
  isPending,
  isCollected,
  isRejected,
  rejectedSample = null,
  orderDate,
  requiredVolume,
  collectedVolume,
  effectiveContainerType,
  containerColor,
  colorName,
}) => {
  const required = requiredVolume ?? sample.requiredVolume;
  const derived = getCollectionRequirements(sample.sampleType);
  const hasContainer =
    (isCollected || isRejected) && Boolean(effectiveContainerType && containerColor);

  return (
    <>
      <LabCardMetaRow>
        {isPending && orderDate ? <QueueAgeMeta since={orderDate} /> : null}
        {isPending && required != null ? <span>{formatVolume(required)} required</span> : null}
        {(isCollected || isRejected) && collectedVolume != null ? (
          <span>
            {formatVolume(collectedVolume)} {isRejected ? 'was collected' : 'collected'}
          </span>
        ) : null}
        {(isCollected || isRejected) && required != null ? (
          <span>{formatVolume(required)} required</span>
        ) : null}
        {hasContainer && effectiveContainerType ? (
          <span>
            {CONTAINER_CONFIG[effectiveContainerType]?.label ?? effectiveContainerType}
            {colorName && colorName !== 'N/A' ? ` · ${colorName} cap` : null}
          </span>
        ) : null}
        {derived.isDerived ? <span>{derived.label}</span> : null}
        {isRejected && rejectedSample?.recollectionSampleId ? (
          <RecollectionRequestedMeta recollectionSampleId={rejectedSample.recollectionSampleId} />
        ) : null}
      </LabCardMetaRow>
      <SampleRejectionTailMeta sample={sample} />
    </>
  );
};

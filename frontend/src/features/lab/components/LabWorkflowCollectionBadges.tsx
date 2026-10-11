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
import {
  StatusPresentationCompactBadge,
  StatusPresentationStack,
} from '@/components/display/StatusPresentationBadge';
import { useLabHeaderCompact } from './LabWorkflowHeader';
import type { StatusPresentation } from '@/types/labProjection';
import {
  LabCardMetaRow,
  LabModalMetaRow,
  QueueAgeMeta,
  RecollectionRequestedMeta,
  SampleRejectionTailMeta,
} from './LabCardMetaRow';
import { LAB_CONFIG } from '../constants';

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
  const compact = useLabHeaderCompact();
  const priority = sample.priority;
  const showPriority = priority === 'urgent' || priority === 'high';

  return (
    <>
      {showPriority && priority ? <LabPriorityBadge priority={priority} size={size} /> : null}
      <SampleTypeBadge sampleType={sample.sampleType} size={size} />
      {statusPresentation ? (
        compact ? (
          <StatusPresentationCompactBadge presentation={statusPresentation} size={size} />
        ) : (
          <StatusPresentationStack presentation={statusPresentation} size={size} />
        )
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

function CollectionOperationalMeta({
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
  MetaRow,
}: CollectionCardMetaProps & {
  MetaRow: typeof LabCardMetaRow | typeof LabModalMetaRow;
}) {
  const required = requiredVolume ?? sample.requiredVolume;
  const derived = getCollectionRequirements(sample.sampleType);
  const hasContainer =
    (isCollected || isRejected) && Boolean(effectiveContainerType && containerColor);
  const attempt = sample.recollectionAttempt ?? 1;
  const max = LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS;
  const showAttemptAlert = sample.isRecollection && attempt > 1;

  return (
    <>
      <MetaRow>
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
        {showAttemptAlert ? (
          <span className={attempt >= max - 1 ? 'text-warning-fg' : undefined}>
            Attempt {attempt}/{max}
          </span>
        ) : null}
      </MetaRow>
      <SampleRejectionTailMeta sample={sample} />
    </>
  );
}

/** Queue card — full collection context (same facts as modal, card typography). */
export const CollectionCardAlerts: React.FC<CollectionCardMetaProps> = props => (
  <CollectionOperationalMeta {...props} MetaRow={LabCardMetaRow} />
);

/** Detail modal — full collection context. */
export const CollectionModalMeta: React.FC<CollectionCardMetaProps> = props => (
  <CollectionOperationalMeta {...props} MetaRow={LabModalMetaRow} />
);

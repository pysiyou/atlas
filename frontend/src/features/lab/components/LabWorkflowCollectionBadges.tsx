import React from 'react';
import type { BadgeSize } from '@/components/primitives';
import type { ContainerType, ContainerTopColor, Sample, RejectedSample } from '@/types';
import { WORKLIST_CARD_BADGE_SIZE } from '@/theme/recipes';
import { buildCollectionOperationalMetaItems } from '../utils/collectionOperationalMetaItems';
import {
  LabPriorityBadge,
  SampleStatusBadge,
  SampleTypeBadge,
} from './LabDomainBadges';
import {
  LabPresentationCompactBadge,
  LabPresentationStack,
} from '@/features/lab/components/LabPresentationBadge';
import { useLabHeaderCompact } from './LabWorkflowHeader';
import type { StatusPresentation } from '@/types/labProjection';
import { LabCardMetaRow, LabModalMetaRow } from './LabCardMetaRow';
import { CollectionOperationalMetaRow } from './CollectionOperationalMetaItems';

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
  size = WORKLIST_CARD_BADGE_SIZE,
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
          <LabPresentationCompactBadge presentation={statusPresentation} size={size} />
        ) : (
          <LabPresentationStack presentation={statusPresentation} size={size} />
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
  MetaRow,
  ...metaProps
}: CollectionCardMetaProps & {
  MetaRow: typeof LabCardMetaRow | typeof LabModalMetaRow;
}) {
  const items = buildCollectionOperationalMetaItems(metaProps);

  return <CollectionOperationalMetaRow items={items} MetaRow={MetaRow} />;
}

/** Queue card — full collection context (same facts as modal, card typography). */
export const CollectionCardAlerts: React.FC<CollectionCardMetaProps> = props => (
  <CollectionOperationalMeta {...props} MetaRow={LabCardMetaRow} />
);

/** Detail modal — full collection context. */
export const CollectionModalMeta: React.FC<CollectionCardMetaProps> = props => (
  <CollectionOperationalMeta {...props} MetaRow={LabModalMetaRow} />
);

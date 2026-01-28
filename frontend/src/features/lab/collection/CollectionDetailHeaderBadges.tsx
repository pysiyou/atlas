/**
 * CollectionDetailHeaderBadges Component
 * Builds the header badges for the collection detail modal
 */

import React from 'react';
import { Badge, Icon } from '@/shared/ui';
import type { ContainerType, ContainerTopColor, Sample, RejectedSample } from '@/types';
import { getContainerIconColor, getCollectionRequirements, formatVolume } from '@/utils';
import { displayId } from '@/utils';
import { StatusBadgeRow } from '../components/LabDetailModal';
import { getContainerIcon, ICONS } from '@/utils';

interface CollectionDetailHeaderBadgesProps {
  sample: Sample;
  isPending: boolean;
  isRejected: boolean;
  isCollected: boolean;
  rejectedSample: RejectedSample | null;
  containerColor?: string;
  effectiveContainerType: ContainerType;
  colorName: string;
}

/**
 * CollectionDetailHeaderBadges Component
 * Renders all header badges for the collection detail modal
 */
export const CollectionDetailHeaderBadges: React.FC<CollectionDetailHeaderBadgesProps> = ({
  sample,
  isPending,
  isRejected,
  isCollected,
  rejectedSample,
  containerColor,
  effectiveContainerType,
  colorName,
}) => {
  return (
    <>
      {(isCollected || isRejected) && containerColor && (
        <span
          className="flex items-center"
          title={`Container: ${effectiveContainerType}, Color: ${colorName}`}
        >
          <Icon
            name={getContainerIcon(effectiveContainerType)}
            className={`w-7 h-7 ${getContainerIconColor(containerColor as ContainerTopColor)}`}
          />
        </span>
      )}
      <StatusBadgeRow sampleType={sample.sampleType} priority={sample.priority || 'routine'} />
      {getCollectionRequirements(sample.sampleType).isDerived && (
        <Badge size="sm" variant="default" className="text-text-tertiary">
          {getCollectionRequirements(sample.sampleType).label}
        </Badge>
      )}
      {(isCollected || isRejected) && 'collectedVolume' in sample && (
        <Badge size="sm" variant="default" className="text-text-tertiary">
          {formatVolume(sample.collectedVolume)} {isRejected ? 'was collected' : 'collected'}
        </Badge>
      )}
      <Badge size="sm" variant="default" className="text-text-tertiary">
        {formatVolume(sample.requiredVolume)} required
      </Badge>
      <Badge variant={isPending ? 'pending' : isRejected ? 'rejected' : 'collected'} size="sm" />
      {isRejected && rejectedSample?.recollectionSampleId && (
        <Badge size="sm" variant="info" className="flex items-center gap-1">
          <Icon name={ICONS.actions.checkCircle} className="w-3 h-3" />
          Recollection: <span className="font-mono text-brand">{displayId.sample(rejectedSample.recollectionSampleId)}</span>
        </Badge>
      )}
    </>
  );
};

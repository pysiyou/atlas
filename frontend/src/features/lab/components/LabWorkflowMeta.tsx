/** Shared collection/entry metadata lines and container icon. */
/**
 * Sample container type and color icon for collection cards and modals.
 */
import React from 'react';
import { Icon } from '@/components';
import { getContainerIconColor } from '../utils';
import type { ContainerType, ContainerTopColor } from '@/types';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import { getContainerIcon } from '@/config/icons';
import { LabAuditLineView } from './LabWorkflowHeader';

interface SampleContainerInfoProps {
  containerType: ContainerType;
  containerColor?: ContainerTopColor;
  size?: 'sm' | 'md';
}

export const SampleContainerInfo: React.FC<SampleContainerInfoProps> = ({
  containerType,
  containerColor,
  size = 'sm',
}) => {
  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.label || 'N/A'
    : 'N/A';

  const iconSize = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';

  return (
    <span className="flex items-center" title={`Container: ${containerType}, Color: ${colorName}`}>
      <Icon
        name={getContainerIcon(containerType)}
        className={`${iconSize} ${containerColor ? getContainerIconColor(containerColor) : 'text-text-disabled'}`}
      />
    </span>
  );
};

/**
 * Sample collection metadata line (who collected, when, sample id).
 */

interface SampleCollectionMetaLineProps {
  sampleId?: string | number;
  collectedAt?: string;
  collectedBy?: string;
  className?: string;
}

export const SampleCollectionMetaLine: React.FC<SampleCollectionMetaLineProps> = ({
  sampleId,
  collectedAt,
  collectedBy,
  className,
}) => {
  if (!collectedAt) return null;

  const line =
    sampleId !== undefined
      ? {
          type: 'sample-collected' as const,
          sampleId,
          collectedAt,
          collectedBy,
        }
      : {
          type: 'collection-only' as const,
          collectedAt,
          collectedBy,
        };

  return <LabAuditLineView line={line} className={className} />;
};

/**
 * Result entry metadata line (who entered values, when).
 */

interface ResultEntryMetaLineProps {
  enteredAt?: string;
  enteredBy?: string;
  className?: string;
}

export const ResultEntryMetaLine: React.FC<ResultEntryMetaLineProps> = ({
  enteredAt,
  enteredBy,
  className,
}) => {
  if (!enteredAt) return null;

  return (
    <LabAuditLineView
      line={{ type: 'result-entered', enteredAt, enteredBy }}
      className={className}
    />
  );
};


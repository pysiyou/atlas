/**
 * StatusBadges - Reusable badge components for lab workflows
 * 
 * Provides consistent badge rendering across cards and modals.
 */

import React from 'react';
import { Badge, Icon } from '@/shared/ui';
import { formatDate } from '@/utils';
import { useUserDisplay } from '@/hooks';
import type { ContainerType, ContainerTopColor } from '@/types';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import { getContainerIconColor } from '@/utils';

/**
 * ContainerInfo - Displays container type and color with icon
 */
interface ContainerInfoProps {
  containerType: ContainerType;
  containerColor?: ContainerTopColor;
  size?: 'sm' | 'md';
}

export const ContainerInfo: React.FC<ContainerInfoProps> = ({
  containerType,
  containerColor,
  size = 'sm',
}) => {
  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.name || 'N/A'
    : 'N/A';

  const iconSize = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';

  return (
    <span
      className="flex items-center"
      title={`Container: ${containerType}, Color: ${colorName}`}
    >
      <Icon
        name={containerType === 'cup' ? 'lab-cup' : 'lab-tube'}
        className={`${iconSize} ${containerColor ? getContainerIconColor(containerColor) : 'text-gray-400'}`}
      />
    </span>
  );
};

/**
 * CollectionInfoLine - Displays sample collection metadata
 */
interface CollectionInfoLineProps {
  sampleId?: string;
  collectedAt?: string;
  collectedBy?: string;
  className?: string;
}

export const CollectionInfoLine: React.FC<CollectionInfoLineProps> = ({
  sampleId,
  collectedAt,
  collectedBy,
  className = 'text-xs text-gray-500',
}) => {
  const { getUserName } = useUserDisplay();

  if (!collectedAt) return null;

  return (
    <span className={className}>
      {sampleId && (
        <>
          Sample <span className="font-medium text-gray-900">{sampleId}</span>{' '}
        </>
      )}
      collected <span className="text-gray-700">{formatDate(collectedAt)}</span>
      {collectedBy && <span> by {getUserName(collectedBy)}</span>}
    </span>
  );
};

/**
 * VolumeBadge - Displays volume information
 */
interface VolumeBadgeProps {
  volume: number;
  label?: string;
  className?: string;
}

export const VolumeBadge: React.FC<VolumeBadgeProps> = ({
  volume,
  label = 'mL',
  className = 'text-gray-500',
}) => (
  <Badge size="sm" variant="default" className={className}>
    {volume.toFixed(1)} {label}
  </Badge>
);

/**
 * FlagBadge - Displays flag count for results with abnormal values
 */
interface FlagBadgeProps {
  count: number;
}

export const FlagBadge: React.FC<FlagBadgeProps> = ({ count }) => {
  if (count === 0) return null;

  return (
    <Badge size="sm" variant="danger">
      {count} FLAG{count > 1 ? 'S' : ''}
    </Badge>
  );
};

/**
 * RecollectionBadge - Badge indicating recollection status
 */
interface RecollectionBadgeProps {
  originalSampleId?: string;
  recollectionSampleId?: string;
}

export const RecollectionBadge: React.FC<RecollectionBadgeProps> = ({
  originalSampleId,
  recollectionSampleId,
}) => {
  if (!originalSampleId && !recollectionSampleId) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {originalSampleId && (
        <Badge size="sm" variant="warning" className="flex items-center gap-1">
          <Icon name="alert-circle" className="w-3 h-3" />
          Recollection of {originalSampleId}
        </Badge>
      )}
      {recollectionSampleId && (
        <Badge size="sm" variant="info" className="flex items-center gap-1">
          <Icon name="alert-circle" className="w-3 h-3" />
          Recollection requested: {recollectionSampleId}
        </Badge>
      )}
    </div>
  );
};

/**
 * ParameterProgressBadge - Shows progress of parameter completion
 */
interface ParameterProgressBadgeProps {
  filled: number;
  total: number;
  isComplete: boolean;
}

export const ParameterProgressBadge: React.FC<ParameterProgressBadgeProps> = ({
  filled,
  total,
  isComplete,
}) => (
  <Badge size="sm" variant={isComplete ? 'success' : 'warning'}>
    {filled}/{total} PARAMS
  </Badge>
);

/**
 * ResultStatusBadge - Badge for result value status (normal, high, low, critical)
 */
interface ResultStatusBadgeProps {
  status: 'normal' | 'high' | 'low' | 'critical';
}

export const ResultStatusBadge: React.FC<ResultStatusBadgeProps> = ({ status }) => {
  if (status === 'normal') return null;

  return (
    <Badge
      size="xs"
      variant={status === 'critical' ? 'danger' : 'warning'}
    >
      {status.toUpperCase()}
    </Badge>
  );
};

/**
 * EntryInfoLine - Displays result entry metadata
 */
interface EntryInfoLineProps {
  enteredAt?: string;
  enteredBy?: string;
  className?: string;
}

export const EntryInfoLine: React.FC<EntryInfoLineProps> = ({
  enteredAt,
  enteredBy,
  className = 'text-xs text-gray-500',
}) => {
  const { getUserName } = useUserDisplay();

  if (!enteredAt) return null;

  return (
    <span className={className}>
      Results entered <span className="text-gray-700">{formatDate(enteredAt)}</span>
      {enteredBy && <span> by {getUserName(enteredBy)}</span>}
    </span>
  );
};

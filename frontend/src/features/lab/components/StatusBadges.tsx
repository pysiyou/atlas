/**
 * StatusBadges - Reusable badge components for lab workflows
 *
 * Provides consistent badge rendering across cards and modals.
 * Centralized components for:
 * - Container info display
 * - Collection/Entry metadata lines
 * - Parameter progress badges
 * - Retest and recollection status badges
 * - Result status and flag count badges
 */

import React from 'react';
import { Badge, Icon, SpinnerLoader } from '@/components';
import { formatDate } from '@/utils';
import { getContainerIconColor } from '@/features/lab/utils';
import { displayId } from '@/utils';
import { useUserLookup } from '@/lib/api/users.api';
import type { ContainerType, ContainerTopColor } from '@/types';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import { getContainerIcon } from '@/config/icons';
import { ICONS } from '@/config/icons';

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
 * CollectionInfoLine - Displays sample collection metadata
 */
interface CollectionInfoLineProps {
  sampleId?: string | number;
  collectedAt?: string;
  collectedBy?: string;
  className?: string;
}

export const CollectionInfoLine: React.FC<CollectionInfoLineProps> = ({
  sampleId,
  collectedAt,
  collectedBy,
  className = 'text-xs text-text-tertiary',
}) => {
  const { getUserName } = useUserLookup();

  if (!collectedAt) return null;

  const formattedSampleId =
    sampleId !== undefined
      ? typeof sampleId === 'number'
        ? displayId.sample(sampleId)
        : sampleId
      : undefined;

  return (
    <span className={className}>
      {formattedSampleId && (
        <>
          Sample <span className="entity-id">{formattedSampleId}</span>{' '}
        </>
      )}
      collected <span className="text-text-secondary">{formatDate(collectedAt)}</span>
      {collectedBy && (
        <>
          {' '}
          by <span className="text-text-secondary">{getUserName(collectedBy)}</span>
        </>
      )}
    </span>
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
 * Critical values pulse to draw attention
 */
interface ResultStatusBadgeProps {
  status: 'normal' | 'high' | 'low' | 'critical' | 'critical-high' | 'critical-low';
}

export const ResultStatusBadge: React.FC<ResultStatusBadgeProps> = ({ status }) => {
  if (status === 'normal') return null;

  const isCritical =
    status === 'critical' || status === 'critical-high' || status === 'critical-low';
  const variant = isCritical
    ? 'critical'
    : status === 'high' || status === 'low'
      ? 'warning'
      : 'default';

  return (
    <Badge size="xs" variant={variant} pulse={isCritical}>
      {status.toUpperCase().replace('-', ' ')}
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
  className = 'text-xs text-text-tertiary',
}) => {
  const { getUserName } = useUserLookup();

  if (!enteredAt) return null;

  return (
    <span className={className}>
      Results entered <span className="text-text-secondary">{formatDate(enteredAt)}</span>
      {enteredBy && (
        <>
          {' '}
          by <span className="text-text-secondary">{getUserName(enteredBy)}</span>
        </>
      )}
    </span>
  );
};

/**
 * RetestBadge - Badge indicating a test is a retest of a previously rejected result
 * Used in result entry and validation workflows
 */
interface RetestBadgeProps {
  /** The retest attempt number (1, 2, 3, etc.) */
  retestNumber: number;
  /** Badge size */
  size?: 'sm' | 'xs';
  /** Additional CSS classes */
  className?: string;
}

export const RetestBadge: React.FC<RetestBadgeProps> = ({
  retestNumber,
  size = 'sm',
  className = '',
}) => (
  <Badge size={size} variant="warning" className={className}>
    RE-TEST #{retestNumber}
  </Badge>
);

/**
 * RecollectionAttemptBadge - Badge indicating a sample recollection attempt number
 * Used when a sample was rejected and a new sample needs to be collected
 */
interface RecollectionAttemptBadgeProps {
  /** The recollection attempt number (1, 2, 3, etc.) */
  attemptNumber: number;
  /** Badge size */
  size?: 'sm' | 'xs';
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the icon */
  showIcon?: boolean;
}

export const RecollectionAttemptBadge: React.FC<RecollectionAttemptBadgeProps> = ({
  attemptNumber,
  size = 'sm',
  className = '',
  showIcon = false,
}) => (
  <Badge size={size} variant="warning" className={`flex items-center gap-1 ${className}`}>
    {showIcon && <SpinnerLoader size="xs" />}
    RE-COLLECT #{attemptNumber}
  </Badge>
);

/**
 * FlagCountBadge - Badge showing the number of flags on a result
 * Used in validation workflow to highlight results needing review
 */
interface FlagCountBadgeProps {
  /** Number of flags */
  count: number;
  /** Badge size */
  size?: 'sm' | 'xs';
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the warning icon */
  showIcon?: boolean;
}

export const FlagCountBadge: React.FC<FlagCountBadgeProps> = ({
  count,
  size = 'sm',
  className = '',
  showIcon = true,
}) => {
  if (count === 0) return null;

  return (
    <Badge size={size} variant="danger" className={`flex items-center gap-1.5 ${className}`}>
      {showIcon && <Icon name={ICONS.actions.warning} className="w-3 h-3 shrink-0 text-current" />}
      {count} flag{count !== 1 ? 's' : ''}
    </Badge>
  );
};

/**
 * ReviewRequiredBadge - Badge indicating review is required (e.g., due to flags)
 */
interface ReviewRequiredBadgeProps {
  /** Badge size */
  size?: 'sm' | 'xs';
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the warning icon */
  showIcon?: boolean;
}

export const ReviewRequiredBadge: React.FC<ReviewRequiredBadgeProps> = ({
  size = 'sm',
  className = '',
  showIcon = true,
}) => (
  <Badge size={size} variant="danger" className={`flex items-center gap-1 ${className}`}>
    {showIcon && <Icon name={ICONS.actions.warning} className="w-3 h-3" />}
    Review Required
  </Badge>
);

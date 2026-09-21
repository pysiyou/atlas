/**
 * Status chips for retest, recollection, flags, review, and queue blocks.
 */

import React from 'react';
import { Badge, Icon, SpinnerLoader } from '@/components';
import type { BadgeSize } from '@/components';
import { ICONS } from '@/config/icons';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';

interface RetestBadgeProps {
  retestNumber: number;
  size?: 'sm' | 'xs';
  className?: string;
}

export const RetestBadge: React.FC<RetestBadgeProps> = ({
  retestNumber,
  size = LAB_CARD_BADGE_SIZE,
  className = '',
}) => (
  <Badge size={size} variant="warning" className={className}>
    RE-TEST #{retestNumber}
  </Badge>
);

interface RecollectionAttemptBadgeProps {
  attemptNumber: number;
  size?: 'sm' | 'xs';
  className?: string;
  showIcon?: boolean;
}

export const RecollectionAttemptBadge: React.FC<RecollectionAttemptBadgeProps> = ({
  attemptNumber,
  size = LAB_CARD_BADGE_SIZE,
  className = '',
  showIcon = false,
}) => (
  <Badge size={size} variant="warning" className={`flex items-center gap-space-1 ${className}`}>
    {showIcon && <SpinnerLoader size="xs" />}
    RE-COLLECT #{attemptNumber}
  </Badge>
);

interface FlagCountBadgeProps {
  count: number;
  size?: 'sm' | 'xs';
  className?: string;
  showIcon?: boolean;
}

export const FlagCountBadge: React.FC<FlagCountBadgeProps> = ({
  count,
  size = LAB_CARD_BADGE_SIZE,
  className = '',
  showIcon = true,
}) => {
  if (count === 0) return null;

  return (
    <Badge size={size} variant="danger" className={`flex items-center gap-space-1-5 ${className}`}>
      {showIcon && <Icon name={ICONS.actions.warning} className="w-3 h-3 shrink-0 text-current" />}
      {count} flag{count !== 1 ? 's' : ''}
    </Badge>
  );
};

interface ReviewRequiredBadgeProps {
  size?: 'sm' | 'xs';
  className?: string;
  showIcon?: boolean;
}

export const ReviewRequiredBadge: React.FC<ReviewRequiredBadgeProps> = ({
  size = LAB_CARD_BADGE_SIZE,
  className = '',
  showIcon = true,
}) => (
  <Badge size={size} variant="danger" className={`flex items-center gap-space-1 ${className}`}>
    {showIcon && <Icon name={ICONS.actions.warning} className="w-3 h-3" />}
    Review Required
  </Badge>
);

interface OrderTestBlockReasonBadgeProps {
  label: string;
  size?: BadgeSize;
  className?: string;
  showIcon?: boolean;
}

export const BlockedReasonBadge: React.FC<OrderTestBlockReasonBadgeProps> = ({
  label,
  size = 'xs',
  className = '',
  showIcon = true,
}) => (
  <Badge
    size={size}
    variant="warning"
    className={`${showIcon ? 'flex items-center gap-space-1' : ''} ${className}`}
  >
    {showIcon ? (
      <Icon name={ICONS.actions.alertCircle} className="w-3 h-3 shrink-0" />
    ) : null}
    {label}
  </Badge>
);

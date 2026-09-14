/**
 * Badge linking a re-test to the prior order test row.
 */

import React from 'react';
import { Badge, Icon } from '@/components';
import { ICONS } from '@/config/icons';
import { displayId } from '@/utils';
import type { BadgeSize } from '@/components/primitives/badgeHelpers';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';

interface RetestOfBadgeProps {
  retestOfTestId: number;
  size?: BadgeSize;
  className?: string;
}

export const RetestOfBadge: React.FC<RetestOfBadgeProps> = ({
  retestOfTestId,
  size = LAB_CARD_BADGE_SIZE,
  className = '',
}) => (
  <Badge size={size} variant="warning" className={`flex items-center gap-1 ${className}`}>
    <Icon name={ICONS.actions.alertCircle} className="w-3 h-3 shrink-0" />
    Re-test of <span className="entity-id">{displayId.orderTest(retestOfTestId)}</span>
  </Badge>
);

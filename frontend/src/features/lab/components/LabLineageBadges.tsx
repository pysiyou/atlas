/** Lineage badges linking recollection tubes and re-tests to prior records. */
/**
 * Badge linking a recollection tube to the immediately previous sample ID.
 */

import React from 'react';
import { Badge, Icon, EntityId } from '@/components';
import type { BadgeSize } from '@/components';
import { ICONS } from '@/config/icons';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';

interface RecollectionOfBadgeProps {
  originalSampleId: number;
  size?: BadgeSize;
  className?: string;
}

export const RecollectionOfBadge: React.FC<RecollectionOfBadgeProps> = ({
  originalSampleId,
  size = LAB_CARD_BADGE_SIZE,
  className = '',
}) => (
  <Badge
    size={size}
    variant="warning"
    className={`flex items-center gap-space-1 ${className}`}
  >
    <Icon name={ICONS.actions.alertCircle} className="w-3 h-3 shrink-0" />
    Recollection of <EntityId type="sample" value={originalSampleId} />
  </Badge>
);

/**
 * Badge linking a re-test to the prior order test row.
 */


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
  <Badge size={size} variant="warning" className={`flex items-center gap-space-1 ${className}`}>
    <Icon name={ICONS.actions.alertCircle} className="w-3 h-3 shrink-0" />
    Re-test of <EntityId type="orderTest" value={retestOfTestId} />
  </Badge>
);


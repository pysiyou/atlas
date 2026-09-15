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
    className={`flex items-center gap-1 ${className}`}
  >
    <Icon name={ICONS.actions.alertCircle} className="w-3 h-3 shrink-0" />
    Recollection of <EntityId type="sample" value={originalSampleId} />
  </Badge>
);

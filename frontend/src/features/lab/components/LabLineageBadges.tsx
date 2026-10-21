/** Lineage badges linking recollection tubes and re-tests to prior records. */
/**
 * Badge linking a recollection tube to the immediately previous sample ID.
 */

import React from 'react';
import { Badge, Icon } from '@/components/primitives';
import { RecordId } from '@/features/shared/components';
import type { BadgeSize } from '@/components/primitives';
import { ICONS } from '@/config/icons';
import { WORKLIST_CARD_BADGE_SIZE } from '@/theme/recipes';

interface RecollectionOfBadgeProps {
  originalSampleId: number;
  size?: BadgeSize;
  className?: string;
}

export const RecollectionOfBadge: React.FC<RecollectionOfBadgeProps> = ({
  originalSampleId,
  size = WORKLIST_CARD_BADGE_SIZE,
  className = '',
}) => (
  <Badge
    size={size}
    variant="warning"
    className={`flex items-center gap-space-1 ${className}`}
  >
    <Icon name={ICONS.actions.alertCircle} className="w-3 h-3 shrink-0" />
    Recollection of <RecordId type="sample" value={originalSampleId} />
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
  size = WORKLIST_CARD_BADGE_SIZE,
  className = '',
}) => (
  <Badge size={size} variant="warning" className={`flex items-center gap-space-1 ${className}`}>
    <Icon name={ICONS.actions.alertCircle} className="w-3 h-3 shrink-0" />
    Re-test of <RecordId type="orderTest" value={retestOfTestId} />
  </Badge>
);


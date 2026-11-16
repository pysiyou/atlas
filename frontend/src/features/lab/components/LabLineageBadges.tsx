/** Lineage badges linking recollection tubes and re-tests to prior records. */
/**
 * Badge linking a recollection tube to the immediately previous sample ID.
 */

import { Badge, Icon } from '@/components/primitives';
import { RecordId } from '@/features/shared';
import type { BadgeSize } from '@/components/primitives';
import { IconKeys } from '@/icons';
import { BADGE, WORKLIST_CARD_BADGE_SIZE } from '@/theme/recipes';

const badgeIconClass = BADGE.icon.xs;

interface RecollectionOfBadgeProps {
  originalAccessionNumber: string;
  size?: BadgeSize;
  className?: string;
}

export function RecollectionOfBadge({
  originalAccessionNumber,
  size = WORKLIST_CARD_BADGE_SIZE,
  className = '',
}: RecollectionOfBadgeProps) { return (
  <Badge
    size={size}
    variant="warning"
    className={`flex items-center gap-space-1 ${className}`}
  >
    <Icon iconKey={IconKeys.actions.alertCircle} className={badgeIconClass} />
    Recollection of <RecordId type="sample" value={originalAccessionNumber} />
  </Badge>
); }

/**
 * Badge linking a re-test to the prior order test row.
 */


interface RetestOfBadgeProps {
  priorTestDisplay: string;
  size?: BadgeSize;
  className?: string;
}

export function RetestOfBadge({
  priorTestDisplay,
  size = WORKLIST_CARD_BADGE_SIZE,
  className = '',
}: RetestOfBadgeProps) { return (
  <Badge size={size} variant="warning" className={`flex items-center gap-space-1 ${className}`}>
    <Icon iconKey={IconKeys.actions.alertCircle} className={badgeIconClass} />
    Re-test of <RecordId type="orderTest" value={priorTestDisplay} />
  </Badge>
); }


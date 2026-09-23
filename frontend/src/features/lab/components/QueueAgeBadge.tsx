/**
 * QueueAgeBadge - Shows how long an item has been waiting in a lab queue.
 */

import { Badge } from '@/components';
import { getQueueAgeInfo } from '../utils/labQueue';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';
import type { BadgeColor } from '@/components/primitives/badgeTypes';

interface QueueAgeBadgeProps {
  since: string | undefined | null;
  className?: string;
}

export const QueueAgeBadge: React.FC<QueueAgeBadgeProps> = ({ since, className }) => {
  const info = getQueueAgeInfo(since);
  if (!info) return null;

  const badgeVariant: BadgeColor =
    info.variant === 'danger' ? 'danger' : info.variant === 'warning' ? 'warning' : 'neutral';

  return (
    <Badge variant={badgeVariant} label={info.label} size={LAB_CARD_BADGE_SIZE} className={className} />
  );
};

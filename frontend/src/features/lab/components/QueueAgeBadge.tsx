/**
 * QueueAgeBadge - Shows how long an item has been waiting in a lab queue.
 */

import React from 'react';
import { Badge } from '@/components';
import { getQueueAgeInfo } from '../utils/queueAge';

interface QueueAgeBadgeProps {
  since: string | undefined | null;
  className?: string;
}

export const QueueAgeBadge: React.FC<QueueAgeBadgeProps> = ({ since, className }) => {
  const info = getQueueAgeInfo(since);
  if (!info) return null;

  const badgeVariant =
    info.variant === 'danger' ? 'danger' : info.variant === 'warning' ? 'warning' : 'default';

  return (
    <Badge variant={badgeVariant} size="xs" className={className}>
      {info.label}
    </Badge>
  );
};

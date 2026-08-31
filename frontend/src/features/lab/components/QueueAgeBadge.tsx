/**
 * QueueAgeBadge - Shows how long an item has been waiting in a lab queue.
 */

import React from 'react';
import { differenceInHours, parseISO, isValid } from 'date-fns';
import { Badge } from '@/components';
import { LAB_CONFIG } from '@/features/lab/constants';

type QueueAgeVariant = 'default' | 'warning' | 'danger';

export interface QueueAgeInfo {
  label: string;
  variant: QueueAgeVariant;
  hours: number;
}

/**
 * Computes queue age label and urgency variant from an ISO timestamp.
 */
export function getQueueAgeInfo(since: string | undefined | null): QueueAgeInfo | null {
  if (!since) return null;

  const date = parseISO(since);
  if (!isValid(date)) return null;

  const hours = Math.max(0, differenceInHours(new Date(), date));
  const label = hours < 1 ? '<1h waiting' : `${hours}h waiting`;

  let variant: QueueAgeVariant = 'default';
  if (hours >= LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS) {
    variant = 'danger';
  } else if (hours >= LAB_CONFIG.QUEUE_AGE_WARNING_HOURS) {
    variant = 'warning';
  }

  return { label, variant, hours };
}

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

/**
 * AttemptCounterBadge - Run N/M with color: 1/3 green, 2/3 yellow, 3/3 red.
 */

import React from 'react';
import { Badge } from '@/shared/ui';
import { cn } from '@/utils';

export interface AttemptCounterBadgeProps {
  attempt: number;
  max: number;
  className?: string;
}

function getVariant(attempt: number, max: number): 'success' | 'warning' | 'danger' {
  const ratio = max > 0 ? attempt / max : 0;
  if (ratio <= 1 / 3) return 'success';
  if (ratio <= 2 / 3) return 'warning';
  return 'danger';
}

export const AttemptCounterBadge: React.FC<AttemptCounterBadgeProps> = ({
  attempt,
  max,
  className,
}) => {
  const variant = getVariant(attempt, max);
  return (
    <Badge variant={variant} size="xs" className={cn('font-mono', className)}>
      Run {attempt}/{max}
    </Badge>
  );
}

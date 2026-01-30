/**
 * TATTimerBadge - Elapsed time since order/entry; optional target countdown.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Badge } from '@/shared/ui';
import { cn } from '@/utils';

const TARGET_TAT_MINUTES = 240; // 4 hours

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function minutesSince(isoDate: string | undefined): number {
  if (!isoDate) return 0;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60));
}

export interface TATTimerBadgeProps {
  /** Order date or result entered date for elapsed calculation */
  sinceIso: string | undefined;
  targetMinutes?: number;
  variant?: 'default' | 'warning' | 'danger';
  className?: string;
}

export const TATTimerBadge: React.FC<TATTimerBadgeProps> = ({
  sinceIso,
  targetMinutes = TARGET_TAT_MINUTES,
  variant,
  className,
}) => {
  const [elapsed, setElapsed] = useState(() => minutesSince(sinceIso));

  useEffect(() => {
    const t = setInterval(() => setElapsed(minutesSince(sinceIso)), 60_000);
    return () => clearInterval(t);
  }, [sinceIso]);

  const displayVariant = useMemo(() => {
    if (variant) return variant;
    if (elapsed >= targetMinutes) return 'danger';
    if (elapsed >= targetMinutes * 0.75) return 'warning';
    return 'default';
  }, [elapsed, targetMinutes, variant]);

  const label = `Elapsed ${formatMinutes(elapsed)}`;
  return (
    <Badge
      variant={displayVariant === 'default' ? 'neutral' : displayVariant}
      size="xs"
      className={cn('font-mono', className)}
    >
      {label}
    </Badge>
  );
}

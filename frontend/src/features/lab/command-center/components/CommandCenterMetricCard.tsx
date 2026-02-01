/**
 * CommandCenterMetricCard - Row 1 metric card: icon+title, X of Y, optional trend.
 * Matches 3-line layout: line 1 = icon + title + optional menu; line 2 = primary + " of " + secondary; line 3 = trend.
 */

import React from 'react';
import { Card, Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import { cn } from '@/utils';

export interface CommandCenterMetricCardProps {
  title: string;
  primaryValue: number | string | null | undefined;
  secondaryValue: number | string | null | undefined;
  icon: IconName;
  /** value + label; format 'count' = "X label", 'pct' = "X% label" (default). */
  trend?: { value: number; label: string; format?: 'pct' | 'count' };
  showMenu?: boolean;
}

export const CommandCenterMetricCard: React.FC<CommandCenterMetricCardProps> = ({
  title,
  primaryValue,
  secondaryValue,
  icon,
  trend,
}) => {
  const trendPositive = (trend?.value ?? 0) >= 0;
  const trendIconColor = trendPositive ? 'text-feedback-success-text' : 'text-feedback-danger-text';
  const displayPrimary = primaryValue ?? 0;
  const displaySecondary = secondaryValue ?? 0;

  return (
    <Card variant="default" padding="sm" className="rounded-lg h-full flex flex-col w-full border-none">
      {/* Line 1: icon + title + optional menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1 min-w-0">
          <Icon name={icon} className="w-3 h-3 text-text-tertiary" />
          <span className="text-xxs font-light text-text-tertiary truncate">{title}</span>
        </div>
      </div>
      {/* Line 2: primary value + " of " + secondary value; null/undefined → 0 */}
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="text-5xl font-bold text-text-primary leading-none tabular-nums">
          {displayPrimary}
        </span>
        <span className="text-base font-normal text-text-secondary">
          out of {displaySecondary}
        </span>
      </div>
      {/* Line 3: trend — icon coloured (green/red), text neutral */}
      <div className="flex items-center gap-1 mt-2 text-sm min-h-5 text-text-secondary">
        {trend != null ? (
          <>
            <Icon name={trendPositive ? 'up-trend' : 'down-trend'} className={cn('w-5 h-5 shrink-0', trendIconColor)} />
            <span>
              {trend.format === 'count'
                ? `${trend.value ?? 0} ${trend.label}`
                : `${Math.abs(trend.value ?? 0)}% ${trend.label}`}
            </span>
          </>
        ) : (
          <span>—</span>
        )}
      </div>
    </Card>
  );
};

/**
 * CommandCenterMetricCard - KPI card: icon circle left, label + value right, trend line below (delta in accent).
 * Matches reference: white card, soft shadow, no progress bar.
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
  const displayPrimary = primaryValue ?? 0;
  const displaySecondary = secondaryValue ?? 0;
  const trendCount = trend != null ? Math.abs(trend.value ?? 0) : 0;
  const trendUp = (trend?.value ?? 0) >= 0;

  return (
    <Card
      variant="default"
      padding="none"
      className={cn(
        'relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-border-subtle',
        'bg-surface-default shadow-1',
        'transition-all duration-200 ease-out',
        'hover:border-border-hover hover:shadow-2'
      )}
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Row: icon circle (left) | label + value (right) */}
        <div className="flex min-w-0 shrink-0 items-center gap-4 p-4 sm:p-5">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded',
              'bg-(--action-primary-muted-bg) text-(--action-primary)',
              'ring-1 ring-(--action-primary)/20'
            )}
          >
            <Icon name={icon} className="h-5 w-5" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
            <div className="flex min-w-0 items-baseline gap-2">
              <span
                className={cn(
                  'truncate tabular-nums font-bold leading-tight text-text-primary',
                  'text-base sm:text-xl'
                )}
              >
                {displayPrimary}
              </span>
              {displaySecondary != null && displaySecondary !== '' && (
                <span className="shrink-0 text-xs font-medium text-text-tertiary">
                  out of {displaySecondary}
                </span>
              )}
            </div>
            <span className="truncate text-xs font-medium text-text-tertiary">
              {title}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1" aria-hidden />

        {/* Trend line: bottom-left, small margin */}
        <div className="shrink-0 text-left m-2 sm:m-2.5">
          {trend != null ? (
            <p className="flex items-center gap-1.5 truncate text-xs font-medium">
              <Icon
                name={trendUp ? 'up-trend' : 'down-trend'}
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  trendUp ? 'text-feedback-success-text' : 'text-feedback-danger-text'
                )}
              />
              <span
                className={cn(
                  'tabular-nums font-semibold',
                  trendUp ? 'text-feedback-success-text' : 'text-feedback-danger-text'
                )}
              >
                {trend.format === 'count' ? trendCount : `${trendCount}%`}
              </span>
              <span className="text-text-tertiary font-normal">{trend.label}</span>
            </p>
          ) : (
            <p className="text-xs text-text-tertiary">—</p>
          )}
        </div>
      </div>
    </Card>
  );
};

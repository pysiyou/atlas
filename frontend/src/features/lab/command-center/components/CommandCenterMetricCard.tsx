/**
 * CommandCenterMetricCard - Compact metric card that fits container without scroll.
 * Layout: header (icon + title, trend top-right) → primary/secondary value → progress → completion.
 * Responsive typography and min-h-0 so content never overflows.
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
  const trendPositive = (trend?.value ?? 0) >= 0;
  const displayPrimary = primaryValue ?? 0;
  const displaySecondary = secondaryValue ?? 0;

  const primaryNum = typeof displayPrimary === 'number' ? displayPrimary : parseInt(String(displayPrimary)) || 0;
  const secondaryNum = typeof displaySecondary === 'number' ? displaySecondary : parseInt(String(displaySecondary)) || 0;
  const completionPct = secondaryNum > 0 ? Math.round((primaryNum / secondaryNum) * 100) : 0;

  return (
    <Card
      variant="default"
      padding="none"
      className={cn(
        'relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-border-default/50',
        'bg-linear-to-br from-surface-default via-surface-default to-surface-hover',
        'transition-all duration-300 ease-out',
        'hover:border-action-primary/30 hover:shadow-md',
        'group'
      )}
    >
      <div
        className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100',
          'bg-linear-to-br from-action-primary/5 via-chart-series-accent/5 to-transparent'
        )}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-2.5">
        {/* Header: icon + title (left), trend (top-right) */}
        <div className="flex shrink-0 items-center justify-between gap-2 min-w-0 border border-red-500">
          <div className="flex min-w-0 items-center gap-1.5 border border-red-500">
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                'border border-action-primary/20 '
              )}
            >
              <Icon name={icon} className="h-3.5 w-3.5 text-action-primary" />
            </div>
            <span className="truncate text-xs font-semibold uppercase tracking-wide text-text-primary">
              {title}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-xs">
            {trend != null ? (
              <>
                <Icon
                  name={trendPositive ? 'up-trend' : 'down-trend'}
                  className={cn(
                    'h-3 w-3',
                    trendPositive ? 'text-feedback-success-text' : 'text-feedback-danger-text'
                  )}
                />
                <span className="truncate font-medium text-text-secondary max-w-32 sm:max-w-40">
                  {trend.format === 'count'
                    ? `${Math.abs(trend.value ?? 0)} ${trend.label}`
                    : `${Math.abs(trend.value ?? 0)}% ${trend.label}`}
                </span>
              </>
            ) : (
              <span className="text-text-tertiary">—</span>
            )}
          </div>
        </div>

        {/* Body: values + progress + completion — flex-1 min-h-0 so it can shrink */}
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-0.5 py-1">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span
              className={cn(
                'shrink-0 truncate tabular-nums font-bold leading-none text-text-primary',
                'text-xl sm:text-2xl lg:text-3xl xl:text-[1.75rem]'
              )}
            >
              {displayPrimary}
            </span>
            <span className="shrink-0 text-sm font-medium text-text-tertiary">
              / {displaySecondary}
            </span>
          </div>

          <div className="h-1 w-full shrink-0 overflow-hidden rounded-full bg-surface-hover">
            <div
              className={cn(
                'h-full bg-linear-to-r from-action-primary to-chart-series-accent',
                'transition-all duration-700 ease-out'
              )}
              style={{ width: `${completionPct}%` }}
            />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-1 text-xs">
            <span className="truncate font-medium text-text-secondary">
              {completionPct}% complete
            </span>
            <span className="shrink-0 text-text-tertiary">
              {Math.max(0, secondaryNum - primaryNum)} pending
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

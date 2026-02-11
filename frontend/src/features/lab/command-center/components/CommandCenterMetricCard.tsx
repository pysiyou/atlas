/**
 * CommandCenterMetricCard - KPI card: icon + trend row, value + title + optional menu.
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
  trend?: { value: number; label: string };
  showMenu?: boolean;
}

export const CommandCenterMetricCard: React.FC<CommandCenterMetricCardProps> = ({
  title,
  primaryValue,
  secondaryValue: _secondaryValue,
  icon,
  trend,
  showMenu = false,
}) => {
  const primary = primaryValue ?? 0;
  const trendCount = trend != null ? Math.abs(trend.value ?? 0) : 0;
  const trendUp = (trend?.value ?? 0) >= 0;
  const trendText = trend != null ? `${trendCount.toFixed(1)} %` : '';

  return (
    <Card
      variant="default"
      padding="none"
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded border 
      border-border-subtle bg-neutral-800 text-text-inverse shadow-sm transition-all duration-200 
      ease-out hover:border-border-hover hover:shadow-md"
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden p-3">
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-brand-muted text-brand ring-1 ring-brand/20">
            <Icon name={icon} className="h-7 w-7" />
          </div>
          {trend != null ? (
            <div className="flex flex-col items-end gap-0">
              <p className="flex items-center gap-1.5 text-base font-normal">
                <Icon
                  name={trendUp ? 'up-trend' : 'down-trend'}
                  className={cn('h-7 w-7 shrink-0', trendUp ? 'text-success-fg' : 'text-danger-fg')}
                />
                <span className="tabular-nums text-text-primary">{trendText}</span>
              </p>
              <span className="text-xs font-normal text-text-muted">{trend.label}</span>
            </div>
          ) : (
            <span className="text-xs text-text-muted">---</span>
          )}
        </div>

        <div className="min-h-0 flex-1" aria-hidden />

        <div className="flex shrink-0 items-end justify-between gap-0">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-xl tabular-nums font-normal leading-tight text-white">
              {primary}
            </span>
            <span className="truncate text-xs font-normal text-text-muted">{title}</span>
          </div>
          {showMenu && (
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label="More options"
            >
              <Icon name="menu-dots" className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

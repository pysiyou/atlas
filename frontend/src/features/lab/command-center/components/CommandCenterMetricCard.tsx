/**
 * CommandCenterMetricCard - Dark-style KPI card: label, primary value, change + arrow.
 * For use in the command center horizontal scroll row.
 */

import React from 'react';
import { Icon } from '@/shared/ui/Icon';
import type { IconName } from '@/shared/ui/Icon';
import { cn } from '@/utils/classnames';

export interface CommandCenterMetricCardProps {
  /** Label above the value (e.g. "Price") */
  title: string;
  /** Main displayed value */
  primaryValue: string;
  /** Change text with optional sign (e.g. "+234,43") */
  changeValue?: string;
  /** Drives arrow icon and change color: green up, red down, muted neutral */
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const changeColorClass = {
  up: 'text-success-fg',
  down: 'text-danger-fg',
  neutral: 'text-text-muted',
} as const;

export const CommandCenterMetricCard: React.FC<CommandCenterMetricCardProps> = ({
  title,
  primaryValue,
  changeValue,
  trend = 'neutral',
  className,
}) => {
  const trendIcon: IconName | null =
    trend === 'up' ? 'up-trend' : trend === 'down' ? 'down-trend' : null;

  return (
    <div
      className={cn(
        'shrink-0 max-h-[88px] w-[150px]  rounded bg-(--surface-hover) p-3',
        'flex flex-col justify-center border border-(--border-subtle)',
        className
      )}
    >
      <div className="text-xs font-normal text-(--text-muted)">{title}</div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-base text-(--text)">{primaryValue}</span>
        {(changeValue != null || trendIcon) && (
          <span className={cn('flex shrink-0 items-center gap-1 text-xs font-normal', changeColorClass[trend])}>
            {changeValue}
            {trendIcon && <Icon name={trendIcon} className="size-4 shrink-0" />}
          </span>
        )}
      </div>
    </div>
  );
};

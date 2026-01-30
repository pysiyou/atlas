/**
 * QueueCountCard - Queue count with label; click navigates to workflow tab.
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import { ICONS } from '@/utils';
import { cn } from '@/utils';

export type QueueTabId = 'collection' | 'entry' | 'validation';

export interface QueueCountCardProps {
  title: string;
  count: number;
  icon?: React.ReactNode;
  onViewQueue?: () => void;
  className?: string;
}

export const QueueCountCard: React.FC<QueueCountCardProps> = ({
  title,
  count,
  icon,
  onViewQueue,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onViewQueue}
      className={cn(
        'w-full text-left rounded-lg border border-border-default bg-surface-default p-4 shadow-sm transition-colors hover:border-action-primary hover:bg-action-primary-muted-bg',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon ?? <Icon name={ICONS.ui.dashboard} className="w-5 h-5 text-text-tertiary" />}
          <span className="text-sm font-medium text-text-primary truncate">{title}</span>
        </div>
        <span className="text-2xl font-bold text-action-primary tabular-nums">{count}</span>
      </div>
      {onViewQueue && (
        <p className="text-xxs text-text-tertiary mt-2">Click to view queue</p>
      )}
    </button>
  );
}

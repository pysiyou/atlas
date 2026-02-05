/**
 * WidgetCard
 * Card shell for analytics widgets: title, icon, primary metric, trend badge, dotted chart title, body.
 */

import React, { type ReactNode } from 'react';
import { Card, Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import { cn } from '@/utils';

export interface WidgetCardChange {
  value: number;
  isPositive: boolean;
}

interface WidgetCardProps {
  title: string;
  icon: IconName;
  value: string;
  change?: WidgetCardChange;
  chartTitle?: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({
  title,
  icon,
  value,
  change,
  chartTitle,
  subtitle,
  children,
  className,
}) => (
  <Card variant="default" padding="sm" className={cn('rounded-lg shadow-sm flex flex-col', className)}>
    <div className="flex items-start justify-between gap-2 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        <Icon name={icon} className="w-5 h-5 text-fg-subtle shrink-0" />
        <span className="text-sm font-medium text-fg truncate">{title}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button type="button" className="p-1 rounded hover:bg-panel-hover text-fg-subtle" aria-label="More options">
          <Icon name="menu-dots" className="w-4 h-4" />
        </button>
        <button type="button" className="p-1 rounded hover:bg-panel-hover text-fg-subtle" aria-label="View details">
          <Icon name="chevron-right" className="w-4 h-4" />
        </button>
      </div>
    </div>
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className="text-2xl font-bold text-fg">{value}</span>
      {change !== undefined && (
        <span
          className={cn(
            'text-sm font-medium',
            change.isPositive ? 'text-success-text' : 'text-danger-fg'
          )}
        >
          {change.isPositive ? '↑' : '↓'}
          {Math.abs(change.value)}%
        </span>
      )}
    </div>
    {subtitle && <p className="text-xs text-fg-subtle mt-0.5">{subtitle}</p>}
    {chartTitle && (
      <p className="text-xs font-medium text-fg-muted mt-3 pb-1 border-b border-dotted border-stroke">
        {chartTitle}
      </p>
    )}
    {children && <div className="mt-2 flex-1 min-h-0">{children}</div>}
  </Card>
);

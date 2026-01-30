/**
 * MetricsCard Component
 * Display a single metric with icon, value, and trend
 */

import React from 'react';
import { Card, Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import { cn } from '@/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: IconName;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'brand' | 'success' | 'warning' | 'danger';
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'brand',
}) => {
  const colorClasses = {
    brand: 'bg-action-primary-muted-bg text-action-primary',
    success: 'bg-feedback-success-bg text-feedback-success-text',
    warning: 'bg-feedback-warning-bg text-feedback-warning-text',
    danger: 'bg-feedback-danger-bg text-feedback-danger-text',
  };

  const trendColor = trend && trend.value >= 0 ? 'text-feedback-success-text' : 'text-feedback-danger-text';

  return (
    <Card variant="metric" padding="sm" className="rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-text-primary mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-secondary">{subtitle}</p>
          )}
          {trend && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trendColor)}>
              <Icon name={trend.value >= 0 ? 'arrow-up' : 'arrow-down'} className="w-3 h-3" />
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-text-tertiary">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>
          <Icon name={icon} className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
};

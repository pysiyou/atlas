/**
 * SmallKpiCard - Count + optional mini line chart; expand icon navigates to tab.
 */

import React, { useId } from 'react';
import { Icon } from '@/shared/ui';
import { ICONS } from '@/utils';
import { Card } from '@/shared/ui';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { cn } from '@/utils';

const AREA_FILL = 'var(--chart-series-primary)';
const AREA_STROKE = 'var(--chart-series-primary)';

export interface SmallKpiCardProps {
  title: string;
  count: number;
  /** Optional sparkline data (e.g. last 7 points). If empty, no chart. */
  sparklineData?: Array<{ name: string; value: number }>;
  /** Expand click navigates to this tab */
  onExpand?: () => void;
  /** Positive = green trend, negative = red, undefined = no trend */
  trend?: { value: number; isPositive: boolean };
  icon?: React.ReactNode;
  className?: string;
}

export const SmallKpiCard: React.FC<SmallKpiCardProps> = ({
  title,
  count,
  sparklineData = [],
  onExpand,
  trend,
  className,
}) => {
  const gradientId = useId();
  const hasChart = sparklineData.length > 0;

  return (
    <Card
      className={cn('rounded-xl flex flex-col min-w-0 overflow-hidden', className)}
      padding="sm"
      variant="default"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs font-medium text-text-primary truncate">{title}</span>
        {onExpand && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onExpand();
            }}
            className="p-1 rounded hover:bg-surface-hover text-text-tertiary"
            aria-label="View queue"
          >
            <Icon name={ICONS.actions.chevronRight} className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-xl font-bold text-text-primary tabular-nums">{count}</span>
        {trend !== undefined && (
          <span
            className={cn(
              'text-sm font-medium',
              trend.isPositive ? 'text-feedback-success-text' : 'text-feedback-danger-text'
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}
          </span>
        )}
      </div>
      {hasChart && (
        <div className="mt-2 h-8 w-full">
          <ResponsiveContainer width="100%" height={32}>
            <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={AREA_FILL} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={AREA_FILL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip content={<></>} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={AREA_STROKE}
                fill={`url(#${gradientId})`}
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

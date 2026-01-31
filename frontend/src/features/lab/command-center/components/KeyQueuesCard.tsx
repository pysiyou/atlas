/**
 * KeyQueuesCard - Horizontal bar chart of workflow distribution + critical alerts summary.
 */

import React from 'react';
import { Card } from '@/shared/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CriticalAlertCard } from './CriticalAlertCard';
import type { CommandCenterData } from '../types';
import type { CriticalAlert } from '../types';

const BAR_COLORS = [
  'var(--chart-series-primary)',
  'var(--chart-series-success)',
  'var(--chart-series-accent)',
];
const AXIS_COLOR = 'var(--chart-axis)';
const GRID_STROKE = 'var(--chart-grid)';

export interface KeyQueuesCardProps {
  workflow: CommandCenterData['workflow'];
  criticalAlerts: CriticalAlert[];
  onNotifyDoctor: (alert: CriticalAlert) => void;
  isNotifying?: boolean;
}

export const KeyQueuesCard: React.FC<KeyQueuesCardProps> = ({
  workflow,
  criticalAlerts,
  onNotifyDoctor,
  isNotifying = false,
}) => {
  const total =
    workflow.preAnalytical.pending +
    workflow.analytical.pending +
    workflow.postAnalytical.pending;
  const chartData = [
    { name: 'Pre-Analytical', value: workflow.preAnalytical.pending, pct: total ? Math.round((workflow.preAnalytical.pending / total) * 100) : 0 },
    { name: 'Analytical', value: workflow.analytical.pending, pct: total ? Math.round((workflow.analytical.pending / total) * 100) : 0 },
    { name: 'Post-Analytical', value: workflow.postAnalytical.pending, pct: total ? Math.round((workflow.postAnalytical.pending / total) * 100) : 0 },
  ].filter(d => d.value > 0 || total === 0);
  if (chartData.length === 0) {
    chartData.push(
      { name: 'Pre-Analytical', value: 0, pct: 0 },
      { name: 'Analytical', value: 0, pct: 0 },
      { name: 'Post-Analytical', value: 0, pct: 0 }
    );
  }

  return (
    <Card className="rounded-xl flex flex-col min-h-0 h-full min-w-0 overflow-hidden" padding="sm" variant="default">
      <div className="shrink-0 flex items-start justify-between mb-2">
        <div>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">
            Key Queues
          </h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            <span className="text-feedback-success-text font-medium">{total}</span>{' '}
            Total Pending
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0 space-y-2 overflow-auto flex flex-col">
        <div className="h-20 shrink-0">
          <ResponsiveContainer width="100%" height={80}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide domain={[0, 'auto']} />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                tickLine={{ stroke: GRID_STROKE }}
                axisLine={false}
              />
              <Tooltip
                content={({ payload }) =>
                  payload?.[0] ? (
                    <div className="bg-surface-overlay border border-border-default rounded px-2 py-1 text-xs shadow-lg">
                      {payload[0].payload.name}: {payload[0].payload.value} (
                      {payload[0].payload.pct}%)
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} minPointSize={4}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {criticalAlerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-feedback-danger-text uppercase tracking-wide">
              Critical Alerts ({criticalAlerts.length})
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {criticalAlerts.slice(0, 3).map(alert => (
                <CriticalAlertCard
                  key={`${alert.orderId}-${alert.testCode}-${alert.parameterName}`}
                  alert={alert}
                  onNotifyDoctor={onNotifyDoctor}
                  isNotifying={isNotifying}
                />
              ))}
              {criticalAlerts.length > 3 && (
                <p className="text-xxs text-text-tertiary">+{criticalAlerts.length - 3} more</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

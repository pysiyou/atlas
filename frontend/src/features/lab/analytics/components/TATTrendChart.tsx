/**
 * TATTrendChart
 * Line chart for daily TAT or compliance from tat.trend. Violet accent for analytics.
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TATMetrics } from '../types';
import { format } from 'date-fns';

const CHART_COLOR = 'var(--chart-series-accent)';
const AXIS_COLOR = 'var(--chart-axis)';
const GRID_STROKE = 'var(--chart-grid)';
const TOOLTIP_BG = 'var(--chart-tooltip-bg)';
const TOOLTIP_BORDER = 'var(--chart-tooltip-border)';

export type TATTrendMode = 'tat' | 'compliance';

interface TATTrendChartProps {
  data: TATMetrics;
  mode: TATTrendMode;
  height?: number;
}

export const TATTrendChart: React.FC<TATTrendChartProps> = ({
  data,
  mode,
  height = 200,
}) => {
  const trend = data.trend ?? [];
  const chartData = trend.map((item) => ({
    date: format(new Date(item.date), 'MMM dd'),
    value: mode === 'tat' ? item.averageTAT : item.complianceRate,
    fullDate: item.date,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center text-text-tertiary text-sm" style={{ height }}>
        No trend data
      </div>
    );
  }

  const valueLabel = mode === 'tat' ? 'Minutes' : '%';
  const tooltipSuffix = mode === 'tat' ? ' min' : '%';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis
          dataKey="date"
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={{ stroke: GRID_STROKE }}
        />
        <YAxis
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={{ stroke: GRID_STROKE }}
          tickFormatter={(v) => (mode === 'compliance' ? `${v}%` : String(v))}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: TOOLTIP_BG,
            border: `1px solid ${TOOLTIP_BORDER}`,
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: unknown) => [typeof value === 'number' ? value + tooltipSuffix : '—', valueLabel]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={CHART_COLOR}
          strokeWidth={2}
          dot={{ fill: CHART_COLOR, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

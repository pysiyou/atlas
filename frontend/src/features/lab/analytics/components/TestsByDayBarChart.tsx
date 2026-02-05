/**
 * TestsByDayBarChart
 * Bar chart for volume.trend (tests per day). Green bars to match reference Sessions card.
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

const BAR_COLOR = 'var(--chart-success)';
const AXIS_COLOR = 'var(--chart-axis)';
const GRID_STROKE = 'var(--chart-grid)';
const TOOLTIP_BG = 'var(--chart-tooltip)';
const TOOLTIP_BORDER = 'var(--chart-tooltip-border)';

interface TrendPoint {
  date: string;
  count: number;
}

interface TestsByDayBarChartProps {
  trend: TrendPoint[];
  height?: number;
}

export const TestsByDayBarChart: React.FC<TestsByDayBarChartProps> = ({
  trend,
  height = 200,
}) => {
  const chartData = trend.map((item) => ({
    date: format(new Date(item.date), 'EEE'),
    count: item.count,
    fullDate: item.date,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center text-text-3 text-sm" style={{ height }}>
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis
          dataKey="date"
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={{ stroke: GRID_STROKE }}
        />
        <YAxis
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={{ stroke: GRID_STROKE }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: TOOLTIP_BG,
            border: `1px solid ${TOOLTIP_BORDER}`,
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: unknown) => [typeof value === 'number' ? `${value} tests` : '—', 'Tests']}
        />
        <Bar dataKey="count" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

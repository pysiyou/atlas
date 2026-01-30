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

const BAR_COLOR = '#16a34a'; // green-600 / --success
const AXIS_COLOR = '#6b7280';

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
      <div className="flex items-center justify-center text-text-tertiary text-sm" style={{ height }}>
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          tickLine={{ stroke: '#e5e7eb' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
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

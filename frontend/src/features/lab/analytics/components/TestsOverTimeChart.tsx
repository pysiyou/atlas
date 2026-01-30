/**
 * TestsOverTimeChart
 * Line chart for volume.trend with optional comparison series. Violet accent; comparison dashed.
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
  Legend,
} from 'recharts';
import { format } from 'date-fns';

const CHART_COLOR = '#8b5cf6';
const COMPARISON_COLOR = '#a78bfa'; // violet-400, lighter
const AXIS_COLOR = '#6b7280';

interface TrendPoint {
  date: string;
  count: number;
}

interface TestsOverTimeChartProps {
  trend: TrendPoint[];
  comparisonTrend?: TrendPoint[];
  currentLabel?: string;
  comparisonLabel?: string;
  height?: number;
}

export const TestsOverTimeChart: React.FC<TestsOverTimeChartProps> = ({
  trend,
  comparisonTrend,
  currentLabel = 'Current',
  comparisonLabel = 'Comparison',
  height = 200,
}) => {
  const dateSet = new Set(trend.map((t) => t.date));
  comparisonTrend?.forEach((t) => dateSet.add(t.date));
  const sortedDates = Array.from(dateSet).sort();
  const chartData = sortedDates.map((date) => {
    const curr = trend.find((t) => t.date === date);
    const comp = comparisonTrend?.find((t) => t.date === date);
    return {
      date: format(new Date(date), 'MMM dd'),
      fullDate: date,
      count: curr?.count ?? 0,
      comparison: comp?.count ?? undefined,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center text-text-tertiary text-sm" style={{ height }}>
        No trend data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
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
          formatter={(value: unknown, name: string | undefined) => [
            typeof value === 'number' ? `${value} tests` : '—',
            name === 'count' ? currentLabel : comparisonLabel,
          ]}
        />
        {comparisonTrend && comparisonTrend.length > 0 && (
          <Legend
            formatter={(value) => (value === 'count' ? currentLabel : comparisonLabel)}
            wrapperStyle={{ fontSize: 12 }}
          />
        )}
        <Line
          type="monotone"
          dataKey="count"
          name="count"
          stroke={CHART_COLOR}
          strokeWidth={2}
          dot={{ fill: CHART_COLOR, r: 3 }}
          activeDot={{ r: 5 }}
        />
        {comparisonTrend && comparisonTrend.length > 0 && (
          <Line
            type="monotone"
            dataKey="comparison"
            name="comparison"
            stroke={COMPARISON_COLOR}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ fill: COMPARISON_COLOR, r: 3 }}
            activeDot={{ r: 5 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};

/**
 * VolumeChart Component
 * Test volume trends over time
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { VolumeMetrics } from '../types';
import { format } from 'date-fns';

interface VolumeChartProps {
  data: VolumeMetrics;
}

export const VolumeChart: React.FC<VolumeChartProps> = ({ data }) => {
  // Format dates for display
  const chartData = data.trend.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    count: item.count,
    fullDate: item.date,
  }));

  return (
    <div className="bg-surface border border-border-default rounded-lg p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Test Volume Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
            tickLine={{ stroke: 'var(--chart-grid)' }}
          />
          <YAxis 
            label={{ value: 'Tests', angle: -90, position: 'insideLeft', style: { fill: 'var(--chart-axis)', fontSize: 12 } }}
            tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
            tickLine={{ stroke: 'var(--chart-grid)' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--chart-tooltip)', 
              border: '1px solid var(--chart-tooltip-border)',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value) => [`${value} tests`, 'Volume']}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="var(--chart-primary)" 
            strokeWidth={2}
            dot={{ fill: 'var(--chart-primary)', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

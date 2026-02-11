/**
 * TATChart Component
 * Turnaround time breakdown chart
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TATMetrics } from '../types';

interface TATChartProps {
  data: TATMetrics;
}

export const TATChart: React.FC<TATChartProps> = ({ data }) => {
  const chartData = [
    { stage: 'Order→Collection', minutes: data.breakdown.orderToCollection },
    { stage: 'Collection→Entry', minutes: data.breakdown.collectionToEntry },
    { stage: 'Entry→Validation', minutes: data.breakdown.entryToValidation },
  ];

  return (
    <div className="bg-surface border border-border-default rounded-lg p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-4">TAT Breakdown by Stage</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis 
            dataKey="stage" 
            tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
            tickLine={{ stroke: 'var(--chart-grid)' }}
          />
          <YAxis 
            label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fill: 'var(--chart-axis)', fontSize: 12 } }}
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
            formatter={(value) => [`${value} min`, 'Time']}
          />
          <Bar dataKey="minutes" fill="var(--chart-primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

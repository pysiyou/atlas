/**
 * RejectionChart Component
 * Sample rejection reasons breakdown
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { RejectionMetrics } from '../types';

interface RejectionChartProps {
  data: RejectionMetrics;
}

export const RejectionChart: React.FC<RejectionChartProps> = ({ data }) => {
  const chartData = data.sampleRejections.topReasons.map(item => ({
    reason: item.reason.length > 20 ? item.reason.substring(0, 20) + '...' : item.reason,
    count: item.count,
    fullReason: item.reason,
  }));

  if (chartData.length === 0) {
    return (
      <div className="bg-surface-default border border-border-default rounded-lg p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Top Rejection Reasons</h3>
        <div className="flex items-center justify-center h-[250px] text-text-tertiary text-sm">
          No rejections in selected period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-default border border-border-default rounded-lg p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Top Rejection Reasons</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis 
            type="number"
            tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
            tickLine={{ stroke: 'var(--chart-grid)' }}
          />
          <YAxis 
            type="category"
            dataKey="reason" 
            width={150}
            tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
            tickLine={{ stroke: 'var(--chart-grid)' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--chart-tooltip-bg)', 
              border: '1px solid var(--chart-tooltip-border)',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value, _name, props) => [`${value} rejections`, props.payload.fullReason]}
          />
          <Bar dataKey="count" fill="var(--chart-series-danger)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

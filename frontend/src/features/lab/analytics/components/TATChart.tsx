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
    <div className="bg-surface border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-4">TAT Breakdown by Stage</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="stage" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value) => [`${value} min`, 'Time']}
          />
          <Bar dataKey="minutes" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

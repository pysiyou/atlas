/**
 * Dashboard stats grid with role-based metric cards.
 */

import React from 'react';
import { Card } from '@/components';

export interface DashboardStat {
  label: string;
  value: string | number;
  today?: number;
  icon: React.ReactNode;
  color: string;
}

export interface DashboardStatsGridProps {
  stats: DashboardStat[];
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({ stats }) => {
  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} padding="lg" hover>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-text-tertiary mb-1">{stat.label}</p>
              <p className="text-3xl font-normal text-text-primary">{stat.value}</p>
              {stat.today !== undefined && (
                <p className="text-xs text-success-fg mt-1">+{stat.today} today</p>
              )}
            </div>
            <div className={`p-3 rounded ${stat.color}`}>{stat.icon}</div>
          </div>
        </Card>
      ))}
    </div>
  );
};

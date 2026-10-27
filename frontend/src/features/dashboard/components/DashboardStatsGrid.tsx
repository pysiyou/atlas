/**
 * Dashboard stats grid with role-based metric cards.
 */

import React from 'react';
import { text, RADIUS, FG } from '@/theme/recipes';
import { Card } from '@/components/surfaces';

export interface DashboardStat {
  label: string;
  value: string | number;
  today?: number;
  icon: React.ReactNode;
  color: string;
}

export interface DashboardStatsGridProps {
  stats: DashboardStat[];
  loading?: boolean;
  skeletonStatCount?: number;
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
  stats,
  loading = false,
  skeletonStatCount = 0,
}) => {
  const count = loading ? skeletonStatCount : stats.length;
  if (count <= 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-6">
      {loading
        ? Array.from({ length: count }).map((_, index) => (
            <Card key={index} padding="lg" hover loading loadingVariant="metric" />
          ))
        : stats.map((stat, index) => (
            <Card key={index} padding="lg" hover>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`${text({ role: 'amount' })} ${FG.captionMuted} mb-space-1`}>{stat.label}</p>
                  <p className={`text-3xl font-normal ${FG.body}`}>{stat.value}</p>
                  {stat.today !== undefined && (
                    <p className={`${text({ role: 'body' })} text-success-fg mt-space-1`}>+{stat.today} today</p>
                  )}
                </div>
                <div className={`p-space-3 ${RADIUS.field} ${stat.color}`}>{stat.icon}</div>
              </div>
            </Card>
          ))}
    </div>
  );
};

/**
 * AnalyticsDashboardSkeleton - Loading placeholder for analytics dashboard.
 * Toolbar row + 3×2 grid of widget card placeholders.
 */

import React from 'react';
import { Card } from '@/shared/ui';
import { Skeleton } from '@/shared/ui/Skeleton';

const WIDGET_COUNT = 6;

function WidgetCardSkeleton() {
  return (
    <Card variant="default" padding="sm" className="rounded-lg shadow-sm flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Skeleton circle width={20} height={20} className="shrink-0" />
          <Skeleton height={14} width={80} />
        </div>
      </div>
      <Skeleton height={28} width={64} className="mb-2" />
      <Skeleton height={12} width={120} className="mb-3" />
      <Skeleton height={140} width="100%" />
    </Card>
  );
}

export const AnalyticsDashboardSkeleton: React.FC = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading analytics">
    <div className="flex flex-wrap items-center justify-between gap-4 py-2">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton height={40} width={160} className="rounded-md" />
        <Skeleton height={20} width={48} />
        <Skeleton height={40} width={140} className="rounded-md" />
      </div>
      <Skeleton height={36} width={120} className="rounded-md" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: WIDGET_COUNT }).map((_, i) => (
        <WidgetCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

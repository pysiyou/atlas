import React from 'react';
import { Skeleton } from '@/components/loaders/Skeleton';
import { RADIUS } from '@/components/theme/recipes';

export const ReportDetailSkeletonContent: React.FC = () => (
  <div className="flex flex-col gap-layout-section p-space-6 max-w-2xl mx-auto" aria-label="Loading report">
    <Skeleton height={24} width={200} className="mb-space-2" />
    <Skeleton height={16} width="60%" />
    <div className={`border border-border-default ${RADIUS.card} overflow-hidden bg-surface mt-space-4`}>
      <div className="p-space-6 space-y-space-3">
        <Skeleton height={14} width="100%" />
        <Skeleton height={14} width="95%" />
        <Skeleton height={14} width="88%" />
        <Skeleton height={14} width="70%" />
        <Skeleton height={80} width="100%" className="mt-space-6" />
      </div>
    </div>
  </div>
);

import React from 'react';
import { Skeleton } from '@/components/loaders/Skeleton';

export const ReportDetailSkeletonContent: React.FC = () => (
  <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto" aria-label="Loading report">
    <Skeleton height={24} width={200} className="mb-2" />
    <Skeleton height={16} width="60%" />
    <div className="border border-border-default rounded-md overflow-hidden bg-surface mt-4">
      <div className="p-6 space-y-3">
        <Skeleton height={14} width="100%" />
        <Skeleton height={14} width="95%" />
        <Skeleton height={14} width="88%" />
        <Skeleton height={14} width="70%" />
        <Skeleton height={80} width="100%" className="mt-6" />
      </div>
    </div>
  </div>
);

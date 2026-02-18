/**
 * LabWorkflowViewSkeleton - Loading placeholder for lab workflow views.
 * Filter row (search + chips) + grid of cards. Shared by Escalation, Entry, Collection.
 */

import React from 'react';
import { Skeleton, SkeletonCard } from '@/shared/ui/Skeleton';

const CARD_COUNT = 8;

export const LabWorkflowViewSkeleton: React.FC = () => (
  <div className="h-full flex flex-col min-h-0" aria-busy="true" aria-label="Loading">
    <div className="shrink-0 px-4 py-3 border-b border-border-default bg-surface-page flex flex-wrap items-center gap-3">
      <Skeleton height={40} width={280} className="rounded-md" />
      <Skeleton height={36} width={120} className="rounded-md" />
      <Skeleton height={32} width={100} className="rounded-full" />
      <Skeleton height={32} width={100} className="rounded-full" />
      <Skeleton height={32} width={90} className="rounded-full" />
    </div>

    <div className="flex-1 min-h-0 overflow-y-auto p-6 grid gap-4 content-start">
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

/**
 * Loading skeleton for the lab tech command center board.
 */

import React from 'react';
import { Skeleton } from '@/components';
import { COMMAND_CENTER_PANEL } from './components';

function PanelSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`flex h-full min-h-48 flex-col overflow-hidden rounded border border-border-default bg-surface shadow-sm ${className ?? ''}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-default px-4 py-2.5">
        <Skeleton height={14} width={96} />
        <Skeleton height={12} width={72} />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton height={120} className="w-full rounded-full" />
        <SkeletonTextPlaceholder lines={3} />
      </div>
    </div>
  );
}

function SkeletonTextPlaceholder({ lines }: { lines: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} height={12} width={index === lines - 1 ? '70%' : '100%'} />
      ))}
    </div>
  );
}

export const LabTechBoardSkeleton: React.FC = () => {
  return (
    <div className={COMMAND_CENTER_PANEL.page} aria-busy="true" aria-label="Loading command center">
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="shrink-0 rounded border border-border-default bg-surface px-3 py-2 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <Skeleton height={14} width={88} />
            <Skeleton height={12} width={160} />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="min-w-0 flex-1 rounded border border-border-default px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <Skeleton circle height={32} width={32} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton height={10} width="55%" />
                    <Skeleton height={18} width="35%" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-12">
          <div className="flex min-h-0 flex-col gap-2 lg:col-span-8 lg:h-full">
            <div className="min-h-48 lg:min-h-0 lg:flex-[2]">
              <PanelSkeleton />
            </div>
            <div className="grid min-h-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:min-h-0 lg:flex-[4]">
              <PanelSkeleton />
              <PanelSkeleton />
            </div>
          </div>
          <div className="flex min-h-0 flex-col gap-2 lg:col-span-4 lg:h-full">
            <div className="min-h-48 lg:min-h-0 lg:flex-[2]">
              <PanelSkeleton />
            </div>
            <div className="min-h-48 lg:min-h-0 lg:flex-[4]">
              <PanelSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

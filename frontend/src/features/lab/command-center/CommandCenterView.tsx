/**
 * CommandCenterView - Full-screen grid dashboard for lab operations.
 */

import React from 'react';
import { ActivityTimeline } from './ActivityTimeline';
import { useTimelineQuery } from './useTimelineQuery';

interface GridBoxProps {
  label: string;
  className?: string;
}

function GridBox({ label, className = '' }: GridBoxProps) {
  return (
    <div
      className={`min-h-0 h-full bg-surface rounded-lg border border-border-default shadow-sm ${className}`}
      aria-label={label}
    />
  );
}

export const CommandCenterView: React.FC = () => {
  const {
    events,
    isLoading,
    isError,
    refetchTimeline,
    hasMore,
    loadMore,
    isLoadingMore,
  } = useTimelineQuery(24, 50);

  return (
    <div className="flex-1 min-h-0 min-w-0 overflow-hidden bg-surface-page p-2">
      <div
        className="h-full min-h-0 grid gap-2 grid-cols-1 lg:grid-cols-12 auto-rows-fr lg:[grid-template-rows:minmax(0,2fr)_minmax(0,1.35fr)_minmax(0,1.65fr)]"
      >
        <div className="min-h-[280px] lg:min-h-0 lg:col-span-8 lg:row-start-1">
          <GridBox label="Box 1" />
        </div>

        <div className="min-h-[320px] lg:min-h-0 lg:col-span-4 lg:row-start-1">
          <GridBox label="Box 2" />
        </div>

        <div className="min-h-[260px] lg:min-h-0 lg:col-span-4 lg:row-start-2">
          <GridBox label="Box 3" />
        </div>

        <div className="min-h-[220px] lg:min-h-0 lg:col-span-2 lg:row-start-2">
          <GridBox label="Box 4" />
        </div>

        <div className="min-h-[220px] lg:min-h-0 lg:col-span-2 lg:row-start-2">
          <GridBox label="Box 5" />
        </div>

        <div className="min-h-[360px] lg:min-h-0 lg:col-span-4 lg:row-start-2 lg:row-span-2 overflow-hidden">
          <div className="h-full bg-surface rounded-lg border border-border-default shadow-sm overflow-hidden flex flex-col">
            <div className="shrink-0 px-4 py-2 border-b border-border-default flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-text-primary">Recent Activity</h3>
              <span className="text-xxs text-text-tertiary shrink-0">Last 24 hours</span>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ActivityTimeline
                events={events}
                isLoading={isLoading}
                isError={isError}
                onRetry={refetchTimeline}
                hasMore={hasMore}
                onLoadMore={loadMore}
                isLoadingMore={isLoadingMore}
              />
            </div>
          </div>
        </div>

        <div className="min-h-[220px] lg:min-h-0 lg:col-span-3 lg:row-start-3">
          <GridBox label="Box 7" />
        </div>

        <div className="min-h-[220px] lg:min-h-0 lg:col-span-3 lg:row-start-3">
          <GridBox label="Box 8" />
        </div>

        <div className="min-h-[220px] lg:min-h-0 lg:col-span-2 lg:row-start-3">
          <GridBox label="Box 9" />
        </div>
      </div>
    </div>
  );
};

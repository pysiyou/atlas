/**
 * CommandCenterView - Full-screen grid dashboard for lab operations.
 */

import React from 'react';
import { ActivityTimeline } from './ActivityTimeline';
import { CategorySummary } from './CategorySummary';
import { OperationsOverview } from './OperationsOverview';
import { CommandCenterPanel } from './commandCenterShared';
import { useTimelineQuery } from './useTimelineQuery';
import { COMMAND_CENTER_PANEL } from './commandCenterStyles';

interface GridBoxProps {
  label: string;
  className?: string;
}

function GridBox({ label, className = '' }: GridBoxProps) {
  return <div className={`${COMMAND_CENTER_PANEL.gridPlaceholder} ${className}`} aria-label={label} />;
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
    <div className={COMMAND_CENTER_PANEL.page}>
      <div
        className="h-full min-h-0 grid gap-2 grid-cols-1 lg:grid-cols-12 auto-rows-fr lg:[grid-template-rows:minmax(0,2fr)_minmax(0,1.35fr)_minmax(0,1.65fr)]"
      >
        <div className="min-h-[280px] lg:min-h-0 lg:col-span-8 lg:row-start-1">
          <OperationsOverview />
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
          <CommandCenterPanel title="Recent Activity" meta="Last 24 hours">
            <div className={COMMAND_CENTER_PANEL.body}>
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
          </CommandCenterPanel>
        </div>

        <div className="min-h-[220px] lg:min-h-0 lg:col-span-3 lg:row-start-3 overflow-hidden">
          <CategorySummary />
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

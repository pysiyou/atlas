/**
 * Lab tech command center — live lab state board.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateCommandCenterQueries } from '@/lib/query/invalidate';
import { COMMAND_CENTER_PANEL } from './components';
import { useLabTechBoard } from './useLabTechBoard';
import { LivePipelineStrip } from './panels/LivePipelineStrip';
import { TodaySnapshotPanel } from './panels/TodaySnapshotPanel';
import { AttentionList } from './panels/AttentionList';
import { QueueAgePanel } from './panels/QueueAgePanel';
import { PriorityMixPanel } from './panels/PriorityMixPanel';
import { RecentActivityPanel } from './panels/RecentActivityPanel';
import { LabTechBoardSkeleton } from './LabTechBoardSkeleton';

export const LabTechBoard: React.FC = () => {
  const board = useLabTechBoard();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!board.isLoading) {
      setLastRefreshedAt(new Date());
    }
  }, [board.isLoading]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await invalidateCommandCenterQueries(queryClient);
      setLastRefreshedAt(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  if (board.isLoading) {
    return <LabTechBoardSkeleton />;
  }

  return (
    <div className={COMMAND_CENTER_PANEL.page}>
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="shrink-0 rounded border border-border-default bg-surface px-3 py-2 shadow-sm">
          <LivePipelineStrip
            counts={board.counts}
            queueAge={board.queueAge}
            blockers={board.blockers}
            totalActive={board.totalActive}
            health={board.health}
            healthMessage={board.healthMessage}
            suggestedTab={board.suggestedTab}
            onRefresh={() => void handleRefresh()}
            isRefreshing={isRefreshing}
            lastRefreshedAt={lastRefreshedAt}
          />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-12">
          {/* Left: Today ~1/3 height; Recent Activity + Needs Attention share the remaining ~2/3 */}
          <div className="flex min-h-0 flex-col gap-2 lg:col-span-8 lg:h-full">
            <div className="min-h-48 lg:min-h-0 lg:flex-[2]">
              <TodaySnapshotPanel
                totalActive={board.totalActive}
                counts={board.counts}
                ageBuckets={board.ageBuckets}
              />
            </div>
            <div className="grid min-h-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:min-h-0 lg:flex-[4]">
              <div className="min-h-48 lg:min-h-0 lg:h-full">
                <RecentActivityPanel />
              </div>
              <div className="min-h-48 lg:min-h-0 lg:h-full">
                <AttentionList items={board.attentionItems} attentionTotal={board.attentionTotal} />
              </div>
            </div>
          </div>

          {/* Right: Priority mix ~1/3; Stage Wait matches bottom-row panel height */}
          <div className="flex min-h-0 flex-col gap-2 lg:col-span-4 lg:h-full">
            <div className="min-h-48 lg:min-h-0 lg:flex-[2]">
              <PriorityMixPanel
                priorityMix={board.priorityMix}
                totalActive={board.totalActive}
              />
            </div>
            <div className="min-h-48 lg:min-h-0 lg:flex-[4]">
              <QueueAgePanel
                counts={board.counts}
                queueAge={board.queueAge}
                totalActive={board.totalActive}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

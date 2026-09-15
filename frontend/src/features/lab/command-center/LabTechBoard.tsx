/**
 * Lab tech command center — live lab state board.
 */

import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ErrorAlert } from '@/components';
import { errorAlertMessage } from '@/utils/feedback';
import { invalidateCommandCenterQueries } from '@/lib/query/invalidate';
import { COMMAND_CENTER_PANEL } from './commandCenterStyles';
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
  const { refetch } = board;
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const lastRefreshedAt = board.dataUpdatedAt ? new Date(board.dataUpdatedAt) : null;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await invalidateCommandCenterQueries(queryClient);
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, refetch]);

  if (board.isLoading) {
    return <LabTechBoardSkeleton />;
  }

  if (board.isError) {
    return (
      <div className={COMMAND_CENTER_PANEL.page}>
        <ErrorAlert
          error={{
            message: errorAlertMessage('lab.page.loadFailed', board.error),
          }}
          onRetry={() => void handleRefresh()}
        />
      </div>
    );
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

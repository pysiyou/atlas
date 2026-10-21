/**
 * Lab dashboard — today panel, attention queue, event log panel, orders table.
 */

import React from 'react';
import { ErrorAlert } from '@/components/feedback';
import { errorAlertMessage } from '@/utils/feedback';
import { SPLIT_WORKSPACE_PANEL } from '@/theme/recipes';
import { SPLIT_BOTTOM_PANEL, SPLIT_BOTTOM_ROW, SPLIT_WORKSPACE_PAGE, SPLIT_TABLE_WRAP } from '@/theme/recipes';
import { useLabMonitorViewModel } from './useLabMonitorViewModel';
import { LabMonitorBoardSkeleton } from './LabMonitorBoardSkeleton';
import { LabOrdersTable } from './LabOrdersTable';
import { LabTodayPanel } from './LabTodayPanel';
import { LabAttentionPanel } from './LabAttentionPanel';
import { LabMonitorEventLogPanel } from '@/features/audit';

export const LabMonitorBoard: React.FC = () => {
  const board = useLabMonitorViewModel();

  if (board.isLoading) {
    return <LabMonitorBoardSkeleton />;
  }

  if (board.isError) {
    return (
      <div className={SPLIT_WORKSPACE_PANEL.page}>
        <ErrorAlert
          error={{
            message: errorAlertMessage('lab.page.loadFailed', board.error),
          }}
          onRetry={() => void board.refetch()}
        />
      </div>
    );
  }

  return (
    <div className={SPLIT_WORKSPACE_PANEL.page}>
      <div className={SPLIT_WORKSPACE_PAGE}>
        <div className={SPLIT_BOTTOM_ROW}>
          <div className={SPLIT_BOTTOM_PANEL}>
            <LabTodayPanel todayPanel={board.todayPanel} />
          </div>
          <div className={SPLIT_BOTTOM_PANEL}>
            <LabAttentionPanel items={board.attentionItems} attentionTotal={board.attentionTotal} />
          </div>
          <div className={SPLIT_BOTTOM_PANEL}>
            <LabMonitorEventLogPanel />
          </div>
        </div>
        <div className={SPLIT_TABLE_WRAP}>
          <LabOrdersTable />
        </div>
      </div>
    </div>
  );
};

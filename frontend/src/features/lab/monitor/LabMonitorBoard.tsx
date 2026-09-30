/**
 * Lab dashboard — today panel, attention queue, event log panel, orders table.
 */

import React from 'react';
import { ErrorAlert } from '@/components';
import { errorAlertMessage } from '@/utils/feedback';
import { MONITOR_PANEL } from './monitorStyles';
import { MONITOR_BOTTOM_PANEL, MONITOR_BOTTOM_ROW, MONITOR_PAGE, MONITOR_TABLE_WRAP } from './monitorStyles';
import { useLabMonitorViewModel } from './useLabMonitorViewModel';
import { LabMonitorBoardSkeleton } from './LabMonitorBoardSkeleton';
import { LabOrdersTable } from './LabOrdersTable';
import { LabTodayPanel } from './LabTodayPanel';
import { LabAttentionPanel } from './LabAttentionPanel';
import { LabMonitorEventLogPanel } from '@/features/event-log';

export const LabMonitorBoard: React.FC = () => {
  const board = useLabMonitorViewModel();

  if (board.isLoading) {
    return <LabMonitorBoardSkeleton />;
  }

  if (board.isError) {
    return (
      <div className={MONITOR_PANEL.page}>
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
    <div className={MONITOR_PANEL.page}>
      <div className={MONITOR_PAGE}>
        <div className={MONITOR_BOTTOM_ROW}>
          <div className={MONITOR_BOTTOM_PANEL}>
            <LabTodayPanel todayPanel={board.todayPanel} />
          </div>
          <div className={MONITOR_BOTTOM_PANEL}>
            <LabAttentionPanel items={board.attentionItems} attentionTotal={board.attentionTotal} />
          </div>
          <div className={MONITOR_BOTTOM_PANEL}>
            <LabMonitorEventLogPanel />
          </div>
        </div>
        <div className={MONITOR_TABLE_WRAP}>
          <LabOrdersTable />
        </div>
      </div>
    </div>
  );
};

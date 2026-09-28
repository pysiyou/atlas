/**
 * Lab dashboard — today panel, attention queue, event log panel, orders table.
 */

import React from 'react';
import { ErrorAlert } from '@/components';
import { errorAlertMessage } from '@/utils/feedback';
import { COMMAND_CENTER_PANEL } from './commandCenterStyles';
import { DASHBOARD_BOTTOM_PANEL, DASHBOARD_BOTTOM_ROW, DASHBOARD_PAGE, DASHBOARD_TABLE_WRAP } from './dashboardStyles';
import { useLabCommandCenterViewModel } from './useLabCommandCenterViewModel';
import { LabCommandCenterBoardSkeleton } from './LabCommandCenterBoardSkeleton';
import { LabDashboardOrdersTable } from './dashboard/LabDashboardOrdersTable';
import { LabDashboardTodayPanel } from './dashboard/LabDashboardTodayPanel';
import { LabAttentionQueue } from './panels/LabAttentionQueue';
import { CommandCenterEventLogPanel } from '@/features/event-log';

export const LabCommandCenterBoard: React.FC = () => {
  const board = useLabCommandCenterViewModel();

  if (board.isLoading) {
    return <LabCommandCenterBoardSkeleton />;
  }

  if (board.isError) {
    return (
      <div className={COMMAND_CENTER_PANEL.page}>
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
    <div className={COMMAND_CENTER_PANEL.page}>
      <div className={DASHBOARD_PAGE}>
        <div className={DASHBOARD_BOTTOM_ROW}>
          <div className={DASHBOARD_BOTTOM_PANEL}>
            <LabDashboardTodayPanel
              todayPanel={board.todayPanel}
              healthMessage={board.healthMessage}
              totalActive={board.totalActive}
              suggestedTab={board.suggestedTab}
            />
          </div>
          <div className={DASHBOARD_BOTTOM_PANEL}>
            <LabAttentionQueue items={board.attentionItems} attentionTotal={board.attentionTotal} />
          </div>
          <div className={DASHBOARD_BOTTOM_PANEL}>
            <CommandCenterEventLogPanel />
          </div>
        </div>
        <div className={DASHBOARD_TABLE_WRAP}>
          <LabDashboardOrdersTable />
        </div>
      </div>
    </div>
  );
};

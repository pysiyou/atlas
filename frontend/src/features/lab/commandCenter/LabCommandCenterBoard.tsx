/**
 * Lab dashboard — KPI row, orders table, volume chart, activity timeline, attention queue.
 */

import React from 'react';
import { ErrorAlert } from '@/components';
import { errorAlertMessage } from '@/utils/feedback';
import { COMMAND_CENTER_PANEL } from './commandCenterStyles';
import { DASHBOARD_BOTTOM_PANEL, DASHBOARD_BOTTOM_ROW, DASHBOARD_PAGE, DASHBOARD_TABLE_WRAP } from './dashboardStyles';
import { useLabCommandCenterViewModel } from './useLabCommandCenterViewModel';
import { LabCommandCenterBoardSkeleton } from './LabCommandCenterBoardSkeleton';
import { LabDashboardKpiRow } from './dashboard/LabDashboardKpiRow';
import { LabDashboardOrdersTable } from './dashboard/LabDashboardOrdersTable';
import { LabDashboardScheduleChart } from './dashboard/LabDashboardScheduleChart';
import { LabAttentionQueue } from './panels/LabAttentionQueue';
import { RecentActivityPanel } from './panels/RecentActivityPanel';

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
        <LabDashboardKpiRow kpis={board.dashboardKpis} />
        <div className={DASHBOARD_TABLE_WRAP}>
          <LabDashboardOrdersTable />
        </div>
        <div className={DASHBOARD_BOTTOM_ROW}>
          <div className={DASHBOARD_BOTTOM_PANEL}>
            <LabDashboardScheduleChart volumeByDay={board.volumeByDay} kpis={board.dashboardKpis} />
          </div>
          <div className={DASHBOARD_BOTTOM_PANEL}>
            <RecentActivityPanel />
          </div>
          <div className={DASHBOARD_BOTTOM_PANEL}>
            <LabAttentionQueue items={board.attentionItems} attentionTotal={board.attentionTotal} />
          </div>
        </div>
      </div>
    </div>
  );
};

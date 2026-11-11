/**
 * Lab dashboard — today panel, attention queue, event log panel, orders table.
 */

import React from 'react';
import { useClientListChrome } from '@/hooks';
import { SPLIT_WORKSPACE_PANEL } from '@/theme/recipes';
import { SPLIT_BOTTOM_PANEL, SPLIT_BOTTOM_ROW, SPLIT_WORKSPACE_PAGE, SPLIT_TABLE_WRAP } from '@/theme/recipes';
import { useLabMonitorViewModel } from './useLabMonitorViewModel';
import { LabOrdersTable } from './LabOrdersTable';
import { LabTodayPanel } from './LabTodayPanel';
import { LabAttentionPanel } from './LabAttentionPanel';
import { LabMonitorEventLogPanel } from '@/features/audit';

export interface LabMonitorBoardProps {
  /** When false, skips full board fetch/poll (inactive monitor tab). */
  monitorActive?: boolean;
}

export const LabMonitorBoard: React.FC<LabMonitorBoardProps> = ({
  monitorActive = true,
}) => {
  const board = useLabMonitorViewModel({ enabled: monitorActive });
  useClientListChrome({
    loadFailedKey: 'lab.page.loadFailed',
    isLoading: board.isLoading,
    isError: board.isError,
    error: board.error,
    refetch: board.refetch,
  });

  const boardLoading = board.isLoading;

  return (
    <div className={SPLIT_WORKSPACE_PANEL.page}>
      <div className={SPLIT_WORKSPACE_PAGE}>
        <div className={SPLIT_BOTTOM_ROW}>
          <div className={SPLIT_BOTTOM_PANEL}>
            <LabTodayPanel todayPanel={board.todayPanel} loading={boardLoading} />
          </div>
          <div className={SPLIT_BOTTOM_PANEL}>
            <LabAttentionPanel
              items={board.attentionItems}
              attentionTotal={board.attentionTotal}
              loading={boardLoading}
            />
          </div>
          <div className={SPLIT_BOTTOM_PANEL}>
            <LabMonitorEventLogPanel loading={boardLoading} />
          </div>
        </div>
        <div className={SPLIT_TABLE_WRAP}>
          <LabOrdersTable />
        </div>
      </div>
    </div>
  );
};

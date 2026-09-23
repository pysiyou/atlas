/**
 * Loading skeleton for the lab dashboard board.
 */

import React from 'react';
import { Panel, Skeleton } from '@/components';
import { COMMAND_CENTER_PANEL } from './commandCenterStyles';
import {
  DASHBOARD_BOTTOM_PANEL,
  DASHBOARD_BOTTOM_ROW,
  DASHBOARD_PAGE,
  DASHBOARD_TABLE_WRAP,
  TODAY_PANEL,
} from './dashboardStyles';

function TodayPanelSkeleton() {
  return (
    <Panel title={<Skeleton height={14} width={48} />} padding="none">
      <div className={TODAY_PANEL.body}>
        <div className="flex min-h-0 flex-1 items-center gap-space-3">
          <Skeleton height={132} width={136} className="shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-space-2">
            <Skeleton height={36} className="w-full" />
            <Skeleton height={36} className="w-full" />
            <Skeleton height={36} className="w-full" />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function PanelSkeleton({ className }: { className?: string }) {
  return (
    <Panel
      title={<Skeleton height={14} width={96} />}
      headerEnd={<Skeleton height={12} width={72} />}
      className={className}
    >
      <div className="flex min-h-48 flex-col gap-space-3">
        <Skeleton height={120} className="w-full" />
      </div>
    </Panel>
  );
}

export const LabCommandCenterBoardSkeleton: React.FC = () => {
  return (
    <div className={COMMAND_CENTER_PANEL.page} aria-busy="true" aria-label="Loading dashboard">
      <div className={DASHBOARD_PAGE}>
        <div className={DASHBOARD_BOTTOM_ROW}>
          <div className={DASHBOARD_BOTTOM_PANEL}>
            <TodayPanelSkeleton />
          </div>
          <div className={DASHBOARD_BOTTOM_PANEL}>
            <PanelSkeleton />
          </div>
          <div className={DASHBOARD_BOTTOM_PANEL}>
            <PanelSkeleton />
          </div>
        </div>
        <div className={DASHBOARD_TABLE_WRAP}>
          <Panel hideHeader padding="none" className="h-full min-h-0">
            <div className="flex h-full flex-col space-y-space-2 p-space-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} height={44} className="w-full" />
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

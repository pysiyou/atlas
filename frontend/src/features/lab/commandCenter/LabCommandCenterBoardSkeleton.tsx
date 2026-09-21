/**
 * Loading skeleton for the lab dashboard board.
 */

import React from 'react';
import { Panel, Skeleton, SkeletonText } from '@/components';
import { COMMAND_CENTER_PANEL } from './commandCenterStyles';
import {
  DASHBOARD_BOTTOM_PANEL,
  DASHBOARD_BOTTOM_ROW,
  DASHBOARD_KPI_CARD,
  DASHBOARD_KPI_ROW,
  DASHBOARD_PAGE,
  DASHBOARD_TABLE_WRAP,
} from './dashboardStyles';

function PanelSkeleton({ className }: { className?: string }) {
  return (
    <Panel
      title={<Skeleton height={14} width={96} />}
      headerEnd={<Skeleton height={12} width={72} />}
      className={className}
    >
      <div className="flex min-h-48 flex-col gap-space-3">
        <Skeleton height={120} className="w-full" />
        <SkeletonText lines={3} />
      </div>
    </Panel>
  );
}

export const LabCommandCenterBoardSkeleton: React.FC = () => {
  return (
    <div className={COMMAND_CENTER_PANEL.page} aria-busy="true" aria-label="Loading dashboard">
      <div className={DASHBOARD_PAGE}>
        <div className={DASHBOARD_KPI_ROW}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={DASHBOARD_KPI_CARD.shell}>
              <Skeleton circle height={40} width={40} />
              <div className="min-w-0 flex-1 space-y-space-2">
                <Skeleton height={28} width="40%" />
                <Skeleton height={12} width="55%" />
              </div>
            </div>
          ))}
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
        <div className={DASHBOARD_BOTTOM_ROW}>
          <div className={DASHBOARD_BOTTOM_PANEL}>
            <PanelSkeleton />
          </div>
          <div className={DASHBOARD_BOTTOM_PANEL}>
            <PanelSkeleton />
          </div>
          <div className={DASHBOARD_BOTTOM_PANEL}>
            <PanelSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
};

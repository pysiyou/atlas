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
  TODAY_KPI,
  TODAY_PANEL,
} from './commandCenterStyles';

function TodayPanelSkeleton() {
  return (
    <Panel
      title={<Skeleton height={14} width={48} />}
      headerEnd={<Skeleton height={12} width={120} />}
      padding="none"
    >
      <div className={TODAY_PANEL.body}>
        <div className={TODAY_PANEL.main}>
          <div className={TODAY_PANEL.stack}>
            <div className={`${TODAY_KPI.table} flex flex-col`}>
              <div className={TODAY_KPI.tableHeadRow}>
                <Skeleton height={12} width="40%" />
                <Skeleton height={12} width="50%" />
                <Skeleton height={12} width={32} className="ml-auto" />
              </div>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={TODAY_KPI.tableRow}>
                  <Skeleton height={12} width="72%" />
                  <Skeleton height={4} className="w-full" />
                  <Skeleton height={12} width={48} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={TODAY_PANEL.footer}>
          <div className={TODAY_KPI.tableTotal}>
            <Skeleton height={12} width={40} />
            <span aria-hidden />
            <Skeleton height={12} width={56} className="ml-auto" />
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
          <Panel title={<Skeleton height={14} width={120} />} padding="none">
            <div className="flex flex-col gap-space-2 p-space-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} height={36} className="w-full" />
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

/**
 * Loading skeleton for the lab dashboard board.
 */

import React from 'react';
import { Panel } from '@/components/surfaces';
import { Skeleton } from '@/components/loaders';
import { MONITOR_PANEL } from './monitorStyles';
import {
  MONITOR_BOTTOM_PANEL,
  MONITOR_BOTTOM_ROW,
  MONITOR_PAGE,
  MONITOR_TABLE_WRAP,
  TODAY_KPI,
  TODAY_PANEL,
} from './monitorStyles';

function TodayPanelSkeleton() {
  return (
    <Panel
      preset="lab.monitor.today"
      headerEnd={<Skeleton height={12} width={120} />}
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

export const LabMonitorBoardSkeleton: React.FC = () => {
  return (
    <div className={MONITOR_PANEL.page} aria-busy="true" aria-label="Loading dashboard">
      <div className={MONITOR_PAGE}>
        <div className={MONITOR_BOTTOM_ROW}>
          <div className={MONITOR_BOTTOM_PANEL}>
            <TodayPanelSkeleton />
          </div>
          <div className={MONITOR_BOTTOM_PANEL}>
            <Panel preset="lab.monitor.attention" headerEnd={<Skeleton height={12} width={72} />}>
              <div className="flex min-h-48 flex-col gap-space-3">
                <Skeleton height={120} className="w-full" />
              </div>
            </Panel>
          </div>
          <div className={MONITOR_BOTTOM_PANEL}>
            <Panel preset="audit.eventLog.monitor" headerEnd={<Skeleton height={12} width={72} />}>
              <div className="flex min-h-48 flex-col gap-space-3">
                <Skeleton height={120} className="w-full" />
              </div>
            </Panel>
          </div>
        </div>
        <div className={MONITOR_TABLE_WRAP}>
          <Panel preset="lab.monitor.ordersTable">
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

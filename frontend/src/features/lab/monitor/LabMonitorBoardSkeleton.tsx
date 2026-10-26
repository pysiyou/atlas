/**
 * Loading skeleton for the lab dashboard board.
 */

import React from 'react';
import { Panel } from '@/components/surfaces';
import { Skeleton } from '@/components/feedback';
import { SPLIT_WORKSPACE_PANEL } from '@/theme/recipes';
import {
  SPLIT_BOTTOM_PANEL,
  SPLIT_BOTTOM_ROW,
  SPLIT_WORKSPACE_PAGE,
  SPLIT_TABLE_WRAP,
  METER_KPI,
  KPI_PANEL,
} from '@/theme/recipes';

function TodayPanelSkeleton() {
  return (
    <Panel
      preset="panel.pageEmbed.flexColumnFill" title="Today"
      headerEnd={<Skeleton height={12} width={120} />}
    >
      <div className={KPI_PANEL.body}>
        <div className={KPI_PANEL.main}>
          <div className={KPI_PANEL.stack}>
            <div className={`${METER_KPI.tableStage} flex flex-col`}>
              <div className={METER_KPI.tableHeadRowStage}>
                <Skeleton height={12} width="40%" />
                <Skeleton height={12} width={32} className="ml-auto" />
                <Skeleton height={12} width={32} className="ml-auto" />
                <Skeleton height={12} width="50%" />
              </div>
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className={METER_KPI.tableRowStage}>
                  <Skeleton height={12} width="72%" />
                  <Skeleton height={12} width={40} className="ml-auto" />
                  <Skeleton height={12} width={40} className="ml-auto" />
                  <Skeleton height={4} className="w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={KPI_PANEL.footer}>
          <div className={METER_KPI.tableTotalStage}>
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
    <div className={SPLIT_WORKSPACE_PANEL.page} aria-busy="true" aria-label="Loading dashboard">
      <div className={SPLIT_WORKSPACE_PAGE}>
        <div className={SPLIT_BOTTOM_ROW}>
          <div className={SPLIT_BOTTOM_PANEL}>
            <TodayPanelSkeleton />
          </div>
          <div className={SPLIT_BOTTOM_PANEL}>
            <Panel preset="panel.pageEmbed.standard" title="Attention queue" headerEnd={<Skeleton height={12} width={72} />}>
              <div className="flex min-h-48 flex-col gap-space-3">
                <Skeleton height={120} className="w-full" />
              </div>
            </Panel>
          </div>
          <div className={SPLIT_BOTTOM_PANEL}>
            <Panel preset="panel.pageEmbed.auto.fill" title="Event log" headerEnd={<Skeleton height={12} width={72} />}>
              <div className="flex min-h-48 flex-col gap-space-3">
                <Skeleton height={120} className="w-full" />
              </div>
            </Panel>
          </div>
        </div>
        <div className={SPLIT_TABLE_WRAP}>
          <Panel preset="panel.pageEmbed.flushHeader">
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

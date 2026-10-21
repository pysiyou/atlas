/**
 * Lab dashboard Today panel — milestone mix among tests worked today (UTC).
 */
import React, { useMemo } from 'react';
import { EmptyState, EMPTY_COPY, DENSE_EMPTY_STATE_TEXT } from '@/components/display';
import { Panel } from '@/components/surfaces/Panel';
import type { LabTodayPanelSnapshot } from './monitorModel';
import { METER_KPI, KPI_PANEL } from '@/theme/recipes';
import { LAB_COPY } from '../constants/labConstants';
import { formatDate } from '@/utils';
import {
  buildTodayStairSegments,
} from './todayPanelStairLayout';
import { TodayMilestoneRow } from './TodayMilestoneRow';
import { TodayPanelHeaderMeta } from './TodayPanelHeaderMeta';

export interface LabTodayPanelProps {
  todayPanel: LabTodayPanelSnapshot;
}

export const LabTodayPanel: React.FC<LabTodayPanelProps> = ({ todayPanel }) => {
  const dayLabel = useMemo(
    () => (todayPanel.dayStartUtc ? formatDate(todayPanel.dayStartUtc) : null),
    [todayPanel.dayStartUtc],
  );

  const totalWorked = todayPanel.testsUpdatedToday;
  const headerRange = dayLabel ? `UTC · ${dayLabel}` : 'UTC · Today';

  const segments = useMemo(() => buildTodayStairSegments(todayPanel), [todayPanel]);

  return (
    <Panel
      preset="panel.pageEmbed.flexColumnFill" title="Today"
      headerEnd={
        <TodayPanelHeaderMeta headerRange={headerRange} totalWorked={totalWorked} />
      }
    >
      <div className={KPI_PANEL.body}>
        {totalWorked === 0 ? (
          <EmptyState
            {...DENSE_EMPTY_STATE_TEXT}
            title={EMPTY_COPY.dashboardTodayKpi.title}
            description={EMPTY_COPY.dashboardTodayKpi.description}
          />
        ) : (
          <>
            <div className={KPI_PANEL.main} aria-label={LAB_COPY.dashboardToday.summaryAria}>
              <div className={KPI_PANEL.stack}>
                <div className={METER_KPI.table} role="table">
                  <div className={METER_KPI.tableHeadRow} role="row">
                    <span className={METER_KPI.tableHeadCell} role="columnheader">
                      {LAB_COPY.dashboardToday.columnMilestone}
                    </span>
                    <span className={METER_KPI.tableHeadCell} role="columnheader">
                      {LAB_COPY.dashboardToday.columnActivity}
                    </span>
                    <span className={METER_KPI.tableHeadCellRight} role="columnheader">
                      {LAB_COPY.dashboardToday.columnShare}
                    </span>
                  </div>
                  <div className={METER_KPI.tableBody} role="rowgroup">
                    {segments.map((segment, index) => (
                      <TodayMilestoneRow
                        key={segment.key}
                        segment={segment}
                        totalWorked={totalWorked}
                        isLast={index === segments.length - 1}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={KPI_PANEL.footer}>
              <div className={METER_KPI.tableTotal} role="row">
                <span className={METER_KPI.tableTotalLabel}>{LAB_COPY.dashboardToday.total}</span>
                <span aria-hidden />
                <span className={METER_KPI.tableTotalValue}>
                  100%
                  <span className={METER_KPI.tableCount}>
                    {' '}
                    · {totalWorked.toLocaleString()}
                  </span>
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
};

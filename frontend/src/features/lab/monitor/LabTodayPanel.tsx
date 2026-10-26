/**
 * Lab dashboard Today panel — per-stage queue vs today's activity (% of monitor universe).
 */
import React, { useMemo } from 'react';
import { EmptyState, EMPTY_COPY, DENSE_EMPTY_STATE_TEXT } from '@/components/display';
import { Panel } from '@/components/surfaces/Panel';
import type { LabTodayPanelSnapshot } from './monitorModel';
import { METER_KPI, KPI_PANEL } from '@/theme/recipes';
import { LAB_COPY } from '../constants/labConstants';
import { formatDate } from '@/utils';
import { buildTodayStageSegments, sumAtStage } from './todayPanelStairLayout';
import { TodayStageRow } from './TodayStageRow';
import { TodayPanelHeaderMeta } from './TodayPanelHeaderMeta';

export interface LabTodayPanelProps {
  todayPanel: LabTodayPanelSnapshot;
}

export const LabTodayPanel: React.FC<LabTodayPanelProps> = ({ todayPanel }) => {
  const dayLabel = useMemo(
    () => (todayPanel.dayStartUtc ? formatDate(todayPanel.dayStartUtc) : null),
    [todayPanel.dayStartUtc],
  );

  const totalTests = todayPanel.totalTests;
  const headerRange = dayLabel ? `UTC · ${dayLabel}` : 'UTC · Today';
  const segments = useMemo(() => buildTodayStageSegments(todayPanel), [todayPanel]);
  const inPipelineNow = useMemo(() => sumAtStage(todayPanel), [todayPanel]);

  return (
    <Panel
      preset="panel.pageEmbed.flexColumnFill"
      title="Today"
      headerEnd={
        <TodayPanelHeaderMeta
          headerRange={headerRange}
          totalTests={totalTests}
          testsUpdatedToday={todayPanel.testsUpdatedToday}
        />
      }
    >
      <div className={KPI_PANEL.body}>
        {totalTests === 0 ? (
          <EmptyState
            {...DENSE_EMPTY_STATE_TEXT}
            title={EMPTY_COPY.dashboardTodayKpi.title}
            description={EMPTY_COPY.dashboardTodayKpi.description}
          />
        ) : (
          <>
            <div className={KPI_PANEL.main} aria-label={LAB_COPY.dashboardToday.summaryAria}>
              <div className={KPI_PANEL.stack}>
                <div className={METER_KPI.tableStage} role="table">
                  <div className={METER_KPI.tableHeadRowStage} role="row">
                    <span className={METER_KPI.tableHeadCell} role="columnheader">
                      {LAB_COPY.dashboardToday.columnStage}
                    </span>
                    <span className={METER_KPI.tableHeadCellMetric} role="columnheader">
                      {LAB_COPY.dashboardToday.columnInQueue}
                    </span>
                    <span className={METER_KPI.tableHeadCellMetric} role="columnheader">
                      {LAB_COPY.dashboardToday.columnToday}
                    </span>
                    <span className={METER_KPI.tableHeadCell} role="columnheader">
                      {LAB_COPY.dashboardToday.columnMix}
                    </span>
                  </div>
                  <div className={METER_KPI.tableBody} role="rowgroup">
                    {segments.map(segment => (
                      <TodayStageRow
                        key={segment.stage}
                        segment={segment}
                        totalTests={totalTests}
                      />
                    ))}
                  </div>
                </div>
                <p className={METER_KPI.footerCaption}>{LAB_COPY.dashboardToday.footnote}</p>
              </div>
            </div>

            <div className={KPI_PANEL.footer}>
              <div className={METER_KPI.tableTotalStage} role="row">
                <span className={METER_KPI.tableTotalLabel}>{LAB_COPY.dashboardToday.footerInPipeline}</span>
                <span className={METER_KPI.tableMetricCell}>
                  <span className={METER_KPI.tablePercent}>
                    {totalTests > 0 ? Math.min(100, Math.round((inPipelineNow / totalTests) * 100)) : 0}%
                  </span>
                  <span className={METER_KPI.tableCount}> · {inPipelineNow.toLocaleString()}</span>
                </span>
                <span className={METER_KPI.tableMetricCell}>
                  <span className={METER_KPI.tablePercent}>
                    {todayPanel.testsUpdatedToday.toLocaleString()}
                  </span>
                  <span className={METER_KPI.tableCount}> {LAB_COPY.dashboardToday.testsWorked}</span>
                </span>
                <span className={METER_KPI.tableTotalValue}>
                  {totalTests.toLocaleString()}
                  <span className={METER_KPI.tableCount}> {LAB_COPY.dashboardToday.footerUniverse}</span>
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
};

/**
 * Lab dashboard Today panel — per-stage queue vs today's activity (% of monitor universe).
 */
import { useMemo } from 'react';
import { EmptyState } from '@/components/display';
import { getEmptyCopy, DENSE_EMPTY_STATE } from '@/strings';

import { Panel } from '@/components/surfaces/Panel';
import type { LabTodayPanelSnapshot } from './monitorModel';
import { METER_KPI, KPI_PANEL } from '@/theme/recipes';
import { useLabCopy } from '@/strings';
import { formatDate } from '@/utils';
import { buildTodayStageSegments, sumAtStage } from './todayPanelStairLayout';
import { TodayStageRow } from './TodayStageRow';
import { TodayPanelHeaderMeta } from './TodayPanelHeaderMeta';

const EMPTY_TODAY_PANEL: LabTodayPanelSnapshot = {
  dayStartUtc: '',
  totalTests: 0,
  testsUpdatedToday: 0,
  stages: [],
};

export interface LabTodayPanelProps {
  todayPanel?: LabTodayPanelSnapshot;
  /** Field-line placeholder until the board snapshot is ready. */
  loading?: boolean;
}

export function LabTodayPanel({
  todayPanel,
  loading = false,
}: LabTodayPanelProps) {
  const labCopy = useLabCopy();
  const snapshot = todayPanel ?? EMPTY_TODAY_PANEL;

  const dayLabel = useMemo(
    () => (snapshot.dayStartUtc ? formatDate(snapshot.dayStartUtc) : null),
    [snapshot.dayStartUtc],
  );

  const totalTests = snapshot.totalTests;
  const headerRange = dayLabel ? `UTC · ${dayLabel}` : 'UTC · Today';
  const segments = useMemo(() => buildTodayStageSegments(snapshot), [snapshot]);
  const inPipelineNow = useMemo(() => sumAtStage(snapshot), [snapshot]);

  return (
    <Panel
      preset="panel.pageEmbed.flexColumnFill"
      title={labCopy.dashboardToday.panelTitle}
      loading={loading}
      loadingHeaderAside={loading}
      headerEnd={
        loading ? undefined : (
          <TodayPanelHeaderMeta
            headerRange={headerRange}
            totalTests={totalTests}
            testsUpdatedToday={snapshot.testsUpdatedToday}
          />
        )
      }
    >
      {totalTests === 0 ? (
        <EmptyState
          {...DENSE_EMPTY_STATE}
          title={getEmptyCopy().dashboardTodayKpi.title}
          description={getEmptyCopy().dashboardTodayKpi.description}
        />
      ) : (
        <div className={KPI_PANEL.body}>
          <div className={KPI_PANEL.main} aria-label={labCopy.dashboardToday.summaryAria}>
            <div className={KPI_PANEL.stack}>
              <div className={METER_KPI.tableStage} role="table">
                <div className={METER_KPI.tableHeadRowStage} role="row">
                  <span className={METER_KPI.tableHeadCell} role="columnheader">
                    {labCopy.dashboardToday.columnStage}
                  </span>
                  <span className={METER_KPI.tableHeadCellMetric} role="columnheader">
                    {labCopy.dashboardToday.columnInQueue}
                  </span>
                  <span className={METER_KPI.tableHeadCellMetric} role="columnheader">
                    {labCopy.dashboardToday.columnToday}
                  </span>
                  <span className={METER_KPI.tableHeadCellMetric} role="columnheader">
                    {labCopy.dashboardToday.columnMix}
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
              <p className={METER_KPI.footerCaption}>{labCopy.dashboardToday.footnote}</p>
            </div>
          </div>

          <div className={KPI_PANEL.footer}>
            <div className={METER_KPI.tableTotalStage} role="row">
              <span className={METER_KPI.tableTotalLabel}>{labCopy.dashboardToday.footerInPipeline}</span>
              <span className={METER_KPI.tableMetricCell}>
                <span className={METER_KPI.tablePercent}>
                  {totalTests > 0 ? Math.min(100, Math.round((inPipelineNow / totalTests) * 100)) : 0}%
                </span>
                <span className={METER_KPI.tableCount}> · {inPipelineNow.toLocaleString()}</span>
              </span>
              <span className={METER_KPI.tableMetricCell}>
                <span className={METER_KPI.tablePercent}>
                  {snapshot.testsUpdatedToday.toLocaleString()}
                </span>
                <span className={METER_KPI.tableCount}> {labCopy.dashboardToday.testsWorked}</span>
              </span>
              <span className={METER_KPI.tableTotalValue}>
                {totalTests.toLocaleString()}
                <span className={METER_KPI.tableCount}> {labCopy.dashboardToday.footerUniverse}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

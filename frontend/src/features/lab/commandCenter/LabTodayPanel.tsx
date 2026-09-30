/**
 * Lab dashboard Today panel — milestone mix among tests worked today (UTC).
 */
import React, { useMemo } from 'react';
import { EmptyState, EMPTY_COPY, DASHBOARD_EMPTY_STATE_TEXT } from '@/components';
import { Panel } from '@/components/surfaces/Panel';
import type { LabTodayPanelSnapshot } from './commandCenterModel';
import { TODAY_KPI, TODAY_PANEL } from './commandCenterStyles';
import {
  LAB_COPY,
  getKpiStageVisual,
  labStageLabel,
  type LabWorkflowKpiStage,
} from '../constants/labConstants';
import { cn, formatDate } from '@/utils';

export interface LabTodayPanelProps {
  todayPanel: LabTodayPanelSnapshot;
}

type TodayMilestoneKey = keyof Pick<
  LabTodayPanelSnapshot,
  'testsWithCollection' | 'testsWithResultEntry' | 'testsWithValidation' | 'testsOffNormalPath'
>;

const MILESTONE_ROWS: Array<{
  key: TodayMilestoneKey;
  legendLabel: string;
  tableLabel: string;
  stage: LabWorkflowKpiStage;
}> = [
  {
    key: 'testsWithCollection',
    legendLabel: labStageLabel('collection').toLowerCase(),
    tableLabel: LAB_COPY.dashboardToday.withCollection,
    stage: 'collection',
  },
  {
    key: 'testsWithResultEntry',
    legendLabel: labStageLabel('entry', 'short').toLowerCase(),
    tableLabel: LAB_COPY.dashboardToday.withEntry,
    stage: 'entry',
  },
  {
    key: 'testsWithValidation',
    legendLabel: labStageLabel('validation').toLowerCase(),
    tableLabel: LAB_COPY.dashboardToday.withValidation,
    stage: 'validation',
  },
  {
    key: 'testsOffNormalPath',
    legendLabel: LAB_COPY.workflow.sentBackShort.toLowerCase(),
    tableLabel: LAB_COPY.dashboardToday.withQualityRework,
    stage: 'sentBack',
  },
];

function meterPercent(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((count / total) * 100));
}

export const LabTodayPanel: React.FC<LabTodayPanelProps> = ({ todayPanel }) => {
  const dayLabel = useMemo(
    () => (todayPanel.dayStartUtc ? formatDate(todayPanel.dayStartUtc) : null),
    [todayPanel.dayStartUtc],
  );

  const totalWorked = todayPanel.testsUpdatedToday;
  const headerRange = dayLabel ? `UTC · ${dayLabel}` : 'UTC · Today';
  const headerMeta =
    totalWorked > 0
      ? `${headerRange} · ${totalWorked.toLocaleString()} ${LAB_COPY.dashboardToday.testsWorked}`
      : headerRange;

  const segments = useMemo(() => {
    return MILESTONE_ROWS.map(row => {
      const count = todayPanel[row.key];
      const visual = getKpiStageVisual(row.stage);
      const percentOfWorked = meterPercent(count, totalWorked);
      return {
        key: row.key,
        legendLabel: row.legendLabel,
        tableLabel: row.tableLabel,
        count,
        percentOfWorked,
        barClass: visual.bar,
        textClass: visual.text,
      };
    });
  }, [todayPanel, totalWorked]);

  const activeSegments = segments.filter(s => s.count > 0);

  return (
    <Panel
      title="Today"
      headerEnd={<span className={TODAY_KPI.headerRange}>{headerMeta}</span>}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      padding="none"
    >
      <div className={TODAY_PANEL.body}>
        {totalWorked === 0 ? (
          <EmptyState
            {...DASHBOARD_EMPTY_STATE_TEXT}
            title={EMPTY_COPY.dashboardTodayKpi.title}
            description={EMPTY_COPY.dashboardTodayKpi.description}
          />
        ) : (
          <>
            <div className={TODAY_PANEL.main} aria-label={LAB_COPY.dashboardToday.summaryAria}>
              <div className={TODAY_PANEL.stack}>
                <div className={TODAY_PANEL.chartBlock}>
                  <div className={TODAY_KPI.legendRow}>
                    {segments.map(segment => (
                      <span key={segment.key} className={TODAY_KPI.legendItem}>
                        <span className={TODAY_KPI.legendLabel}>{segment.legendLabel}</span>
                        <span className="text-text-tertiary" aria-hidden>·</span>
                        <span className={cn(TODAY_KPI.legendValue, segment.textClass)}>
                          {segment.percentOfWorked}%
                        </span>
                      </span>
                    ))}
                  </div>

                  <div
                    className={TODAY_KPI.segmentBar}
                    role="img"
                    aria-label="Today's milestone mix"
                  >
                    {activeSegments.length === 0 ? (
                      <div className={TODAY_KPI.segmentBarEmpty} />
                    ) : (
                      activeSegments.map(segment => (
                        <div
                          key={segment.key}
                          className={cn(TODAY_KPI.segment, segment.barClass)}
                          style={{ flexGrow: segment.count }}
                          title={`${segment.tableLabel}: ${segment.count}`}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className={TODAY_KPI.table} role="table">
                  <div className={TODAY_KPI.tableBody} role="rowgroup">
                    {segments.map(segment => (
                      <div key={segment.key} className={TODAY_KPI.tableRow} role="row">
                        <span className={TODAY_KPI.tableLabel} role="cell">
                          {segment.tableLabel}
                        </span>
                        <div
                          className={TODAY_KPI.tableRowMeterTrack}
                          role="presentation"
                          aria-hidden
                        >
                          <div
                            className={cn(TODAY_KPI.tableRowMeterFill, segment.barClass)}
                            style={{ width: `${segment.percentOfWorked}%` }}
                          />
                        </div>
                        <span className={TODAY_KPI.tableValue} role="cell">
                          <span className={TODAY_KPI.tablePercent}>
                            {segment.percentOfWorked}%
                          </span>
                          <span className={TODAY_KPI.tableCount}>
                            {' '}
                            · {segment.count.toLocaleString()}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={TODAY_PANEL.footer}>
              <div className={TODAY_KPI.tableTotal} role="row">
                <span className={TODAY_KPI.tableTotalLabel}>{LAB_COPY.dashboardToday.total}</span>
                <span className={TODAY_KPI.tableTotalValue}>
                  100%
                  <span className={TODAY_KPI.tableCount}>
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

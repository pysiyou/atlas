/**
 * Lab dashboard Today panel — UTC day throughput KPIs (list + progress rows).
 */
import React, { useMemo } from 'react';
import { EmptyState, EMPTY_COPY, DASHBOARD_EMPTY_STATE_TEXT, Icon } from '@/components';
import type { IconName } from '@/components';
import { Panel } from '@/components/surfaces/Panel';
import type { LabTodayPanelSnapshot } from '../commandCenterModel';
import { TODAY_KPI, TODAY_PANEL } from '../dashboardStyles';
import {
  LAB_COPY,
  LAB_WORKFLOW_KPI_ICONS,
  getKpiStageVisual,
  type LabWorkflowKpiStage,
} from '../../constants/labConstants';
import { formatDate } from '@/utils';

export interface LabDashboardTodayKpiPanelProps {
  todayPanel: LabTodayPanelSnapshot;
}

type WorkflowKpiKey = keyof Pick<
  LabTodayPanelSnapshot,
  'specimensCollectedToday' | 'testsResultedToday' | 'testsValidatedToday' | 'testsSentBackToday'
>;

const WORKFLOW_KPI_ROWS: Array<{
  stage: LabWorkflowKpiStage;
  key: WorkflowKpiKey;
  label: string;
  tag: string;
  icon: IconName;
}> = [
  {
    stage: 'collection',
    key: 'specimensCollectedToday',
    label: 'Specimens collected',
    tag: 'Collection',
    icon: LAB_WORKFLOW_KPI_ICONS.collection,
  },
  {
    stage: 'entry',
    key: 'testsResultedToday',
    label: 'Results entered',
    tag: 'Entry',
    icon: LAB_WORKFLOW_KPI_ICONS.entry,
  },
  {
    stage: 'validation',
    key: 'testsValidatedToday',
    label: 'Results validated',
    tag: 'Validation',
    icon: LAB_WORKFLOW_KPI_ICONS.validation,
  },
  {
    stage: 'sentBack',
    key: 'testsSentBackToday',
    label: 'Tests sent back',
    tag: LAB_COPY.workflow.sentBackShort,
    icon: LAB_WORKFLOW_KPI_ICONS.sentBack,
  },
];

function hasWorkflowActivity(panel: LabTodayPanelSnapshot): boolean {
  return WORKFLOW_KPI_ROWS.some(item => panel[item.key] > 0);
}

function hasAnyActivity(panel: LabTodayPanelSnapshot): boolean {
  return panel.testsUpdatedToday > 0 || hasWorkflowActivity(panel);
}

function meterPercent(count: number, maxCount: number): number {
  if (maxCount <= 0) return 0;
  return Math.min(100, Math.round((count / maxCount) * 100));
}

interface TodayKpiMeterRowProps {
  stage: LabWorkflowKpiStage;
  label: string;
  tag: string;
  icon: IconName;
  count: number;
  percent: number;
}

const TodayKpiMeterRow: React.FC<TodayKpiMeterRowProps> = ({
  stage,
  label,
  tag,
  icon,
  count,
  percent,
}) => {
  const visual = getKpiStageVisual(stage);
  return (
  <div className={TODAY_KPI.row}>
    <div className={TODAY_KPI.iconWrap(visual)}>
      <Icon name={icon} className={TODAY_KPI.icon} aria-hidden />
    </div>
    <div className={TODAY_KPI.labelBlock}>
      <span className={TODAY_KPI.rowTitle}>{label}</span>
      <span className={TODAY_KPI.tag}>{tag}</span>
    </div>
    <div className={TODAY_KPI.meterWrap}>
      <div className={TODAY_KPI.meterTrack(visual)} role="presentation">
        <div className={TODAY_KPI.meterFill(visual)} style={{ width: `${percent}%` }} />
        <span className={TODAY_KPI.meterLabel}>
          {percent}% ({count.toLocaleString()})
        </span>
      </div>
    </div>
  </div>
  );
};

export const LabDashboardTodayKpiPanel: React.FC<LabDashboardTodayKpiPanelProps> = ({
  todayPanel,
}) => {
  const dayLabel = useMemo(
    () => (todayPanel.dayStartUtc ? formatDate(todayPanel.dayStartUtc) : null),
    [todayPanel.dayStartUtc],
  );
  const hasActivity = hasAnyActivity(todayPanel);
  const showWorkflowRows = hasWorkflowActivity(todayPanel);

  const maxCount = useMemo(
    () => Math.max(1, ...WORKFLOW_KPI_ROWS.map(row => todayPanel[row.key])),
    [todayPanel],
  );

  const headerRange = dayLabel ? `UTC · ${dayLabel}` : 'UTC · Today';

  return (
    <Panel
      title="Today"
      headerEnd={<span className={TODAY_KPI.headerRange}>{headerRange}</span>}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      padding="none"
    >
      <div className={TODAY_PANEL.body}>
        {!hasActivity ? (
          <EmptyState
            {...DASHBOARD_EMPTY_STATE_TEXT}
            title={EMPTY_COPY.dashboardTodayKpi.title}
            description={EMPTY_COPY.dashboardTodayKpi.description}
          />
        ) : (
          <>
            <p className={TODAY_KPI.summaryLine} aria-label={LAB_COPY.dashboardToday.summaryAria}>
              {LAB_COPY.dashboardToday.testsWorked}(
              <span className={TODAY_KPI.summaryValue}>
                {todayPanel.testsUpdatedToday.toLocaleString()}
              </span>
              ), {LAB_COPY.dashboardToday.createdToday} (
              <span className={TODAY_KPI.summaryValue}>
                {todayPanel.testsWorkedCreatedToday.toLocaleString()}
              </span>
              ) {LAB_COPY.dashboardToday.completedToday}(
              <span className={TODAY_KPI.summaryValue}>
                {todayPanel.testsWorkedCreatedCompletedToday.toLocaleString()}
              </span>
              )
            </p>
            {showWorkflowRows ? (
              <ul className={TODAY_KPI.list}>
                {WORKFLOW_KPI_ROWS.map(row => {
                  const count = todayPanel[row.key];
                  const percent = meterPercent(count, maxCount);
                  return (
                    <li key={row.key}>
                      <TodayKpiMeterRow
                        stage={row.stage}
                        label={row.label}
                        tag={row.tag}
                        icon={row.icon}
                        count={count}
                        percent={percent}
                      />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={TODAY_KPI.summaryMeta}>No workflow milestones recorded yet today.</p>
            )}
          </>
        )}
      </div>
    </Panel>
  );
};

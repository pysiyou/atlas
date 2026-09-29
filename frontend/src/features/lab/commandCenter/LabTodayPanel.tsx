/**
 * Lab dashboard Today panel — milestone mix among tests worked today (UTC).
 */
import React, { useMemo } from 'react';
import { EmptyState, EMPTY_COPY, DASHBOARD_EMPTY_STATE_TEXT, Icon } from '@/components';
import type { IconName } from '@/components';
import { Panel } from '@/components/surfaces/Panel';
import type { LabTodayPanelSnapshot } from './commandCenterModel';
import { TODAY_KPI, TODAY_PANEL } from './commandCenterStyles';
import {
  LAB_COPY,
  LAB_WORKFLOW_KPI_ICONS,
  getKpiStageVisual,
  labStageLabel,
  type LabWorkflowKpiStage,
} from '../constants/labConstants';
import { formatDate } from '@/utils';

export interface LabTodayPanelProps {
  todayPanel: LabTodayPanelSnapshot;
}

type TodayMilestoneKey = keyof Pick<
  LabTodayPanelSnapshot,
  'testsWithCollection' | 'testsWithResultEntry' | 'testsWithValidation' | 'testsOffNormalPath'
>;

const MILESTONE_ROWS: Array<{
  stage: LabWorkflowKpiStage;
  key: TodayMilestoneKey;
  label: string;
  tag: string;
  icon: IconName;
}> = [
  {
    stage: 'collection',
    key: 'testsWithCollection',
    label: LAB_COPY.dashboardToday.withCollection,
    tag: labStageLabel('collection', 'short'),
    icon: LAB_WORKFLOW_KPI_ICONS.collection,
  },
  {
    stage: 'entry',
    key: 'testsWithResultEntry',
    label: LAB_COPY.dashboardToday.withEntry,
    tag: labStageLabel('entry', 'short'),
    icon: LAB_WORKFLOW_KPI_ICONS.entry,
  },
  {
    stage: 'validation',
    key: 'testsWithValidation',
    label: LAB_COPY.dashboardToday.withValidation,
    tag: labStageLabel('validation', 'short'),
    icon: LAB_WORKFLOW_KPI_ICONS.validation,
  },
  {
    stage: 'sentBack',
    key: 'testsOffNormalPath',
    label: LAB_COPY.dashboardToday.withQualityRework,
    tag: LAB_COPY.workflow.sentBackShort,
    icon: LAB_WORKFLOW_KPI_ICONS.sentBack,
  },
];

function meterPercent(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((count / total) * 100));
}

function TodayKpiMeterRow({
  stage,
  label,
  tag,
  icon,
  count,
  percent,
}: {
  stage: LabWorkflowKpiStage;
  label: string;
  tag: string;
  icon: IconName;
  count: number;
  percent: number;
}) {
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
        <div className={TODAY_KPI.meterTrack} role="presentation">
          <div className={TODAY_KPI.meterFill} style={{ width: `${percent}%` }} />
          <span className={TODAY_KPI.meterLabel}>
            {percent}% ({count.toLocaleString()})
          </span>
        </div>
      </div>
    </div>
  );
}

export const LabTodayPanel: React.FC<LabTodayPanelProps> = ({ todayPanel }) => {
  const dayLabel = useMemo(
    () => (todayPanel.dayStartUtc ? formatDate(todayPanel.dayStartUtc) : null),
    [todayPanel.dayStartUtc],
  );

  const totalWorked = todayPanel.testsUpdatedToday;
  const headerRange = dayLabel ? `UTC · ${dayLabel}` : 'UTC · Today';

  return (
    <Panel
      title="Today"
      headerEnd={<span className={TODAY_KPI.headerRange}>{headerRange}</span>}
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
            <p className={TODAY_KPI.summaryLine} aria-label={LAB_COPY.dashboardToday.summaryAria}>
              <span className={TODAY_KPI.summaryValue}>{totalWorked.toLocaleString()}</span>{' '}
              {LAB_COPY.dashboardToday.testsWorked}
            </p>
            <ul className={TODAY_KPI.list}>
              {MILESTONE_ROWS.map(row => {
                const count = todayPanel[row.key];
                const percent = meterPercent(count, totalWorked);
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
          </>
        )}
      </div>
    </Panel>
  );
};

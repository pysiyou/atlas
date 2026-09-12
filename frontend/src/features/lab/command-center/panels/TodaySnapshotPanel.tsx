/**
 * Today's shift output — two equal halves: shift progress and live backlog.
 */

import React from 'react';
import { Panel, PanelBody } from '../components';
import type { DonutSegment } from '../components/DonutChart';
import type { LabTechBoardData } from '../boardTypes';
import { MetricDonutHalf, type MetricDonutLegendItem } from './MetricDonutHalf';

interface TodaySnapshotPanelProps {
  totalActive: number;
  today: LabTechBoardData['todayThroughput'];
  ageBuckets: LabTechBoardData['ageBuckets'];
}

const FINISHED_COLORS = {
  collected: 'fill-info-fg-emphasis',
  entered: 'fill-warning-fg-emphasis',
  validated: 'fill-success-fg-emphasis',
  rejected: 'fill-danger-fg-emphasis',
} as const;

const AGE_COLORS = {
  fresh: 'fill-brand',
  onTrack: 'fill-info-fg-emphasis',
  warning: 'fill-warning-fg-emphasis',
  critical: 'fill-danger-fg-emphasis',
} as const;

export const TodaySnapshotPanel: React.FC<TodaySnapshotPanelProps> = ({
  totalActive,
  today,
  ageBuckets,
}) => {
  const stageCompletions = today.collected + today.resultsEntered + today.validated;
  const finishedSegments: DonutSegment[] = [
    { value: today.collected, colorClass: FINISHED_COLORS.collected },
    { value: today.resultsEntered, colorClass: FINISHED_COLORS.entered },
    { value: today.validated, colorClass: FINISHED_COLORS.validated },
    ...(today.rejected > 0
      ? [{ value: today.rejected, colorClass: FINISHED_COLORS.rejected }]
      : []),
  ];
  const finishedTotal = finishedSegments.reduce((sum, segment) => sum + segment.value, 0);

  const ageSegments: DonutSegment[] = [
    { value: ageBuckets.fresh, colorClass: AGE_COLORS.fresh },
    { value: ageBuckets.onTrack, colorClass: AGE_COLORS.onTrack },
    { value: ageBuckets.warning, colorClass: AGE_COLORS.warning },
    { value: ageBuckets.critical, colorClass: AGE_COLORS.critical },
  ];

  const aging = ageBuckets.warning + ageBuckets.critical;

  const finishedLegend: MetricDonutLegendItem[] = [
    {
      colorClass: FINISHED_COLORS.collected,
      label: 'Collected',
      value: today.collected,
      total: finishedTotal,
    },
    {
      colorClass: FINISHED_COLORS.entered,
      label: 'Entered',
      value: today.resultsEntered,
      total: finishedTotal,
    },
    {
      colorClass: FINISHED_COLORS.validated,
      label: 'Validated',
      value: today.validated,
      total: finishedTotal,
    },
    ...(today.rejected > 0
      ? [
          {
            colorClass: FINISHED_COLORS.rejected,
            label: 'Rejected',
            value: today.rejected,
            total: finishedTotal,
          },
        ]
      : []),
  ];

  const ageLegend: MetricDonutLegendItem[] = [
    {
      colorClass: AGE_COLORS.fresh,
      label: 'Fresh',
      value: ageBuckets.fresh,
      total: totalActive,
    },
    {
      colorClass: AGE_COLORS.onTrack,
      label: 'On track',
      value: ageBuckets.onTrack,
      total: totalActive,
    },
    {
      colorClass: AGE_COLORS.warning,
      label: 'Waiting 4h+',
      value: ageBuckets.warning,
      total: totalActive,
    },
    {
      colorClass: AGE_COLORS.critical,
      label: 'Waiting 8h+',
      value: ageBuckets.critical,
      total: totalActive,
    },
  ];

  const shiftSummary =
    stageCompletions > 0
      ? `${stageCompletions} stage action${stageCompletions === 1 ? '' : 's'} completed${
          today.ordersCompleted > 0
            ? ` · ${today.ordersCompleted} order${today.ordersCompleted === 1 ? '' : 's'} closed`
            : ''
        }`
      : 'No stage completions yet today.';

  const backlogSummary =
    totalActive > 0
      ? aging > 0
        ? `${aging} test${aging === 1 ? '' : 's'} past TAT thresholds`
        : `${totalActive} active test${totalActive === 1 ? '' : 's'} — all on track`
      : 'Pipeline is clear right now.';

  const metaParts = ['Since midnight'];
  if (today.ordersCreated > 0) {
    metaParts.push(`${today.ordersCreated} in`);
  }
  if (today.ordersCompleted > 0) {
    metaParts.push(`${today.ordersCompleted} closed`);
  }

  return (
    <Panel title="Today" meta={metaParts.join(' · ')}>
      <PanelBody>
        <div className="grid h-full min-h-0 grid-cols-2 divide-x divide-border-subtle">
          <MetricDonutHalf
            title="Shift Output"
            summary={shiftSummary}
            centerLabel={String(stageCompletions)}
            centerDetail="done"
            segments={finishedSegments}
            legend={finishedLegend}
          />
          <MetricDonutHalf
            title="In the Lab"
            summary={backlogSummary}
            centerLabel={String(totalActive)}
            centerDetail="active"
            segments={ageSegments}
            legend={ageLegend}
          />
        </div>
      </PanelBody>
    </Panel>
  );
};

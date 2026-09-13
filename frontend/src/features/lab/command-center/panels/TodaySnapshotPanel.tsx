/**
 * Today snapshot — live pipeline composition by stage and wait age.
 */

import React from 'react';
import { Panel, PanelBody } from '../components';
import type { DonutSegment } from '../components/DonutChart';
import type { LabTechBoardData } from '../boardTypes';
import { MetricDonutHalf, type MetricDonutLegendItem } from './MetricDonutHalf';
import {
  COMMAND_CENTER_AGE_COLORS,
  COMMAND_CENTER_STAGE_COLORS,
} from '../components/styles';

interface TodaySnapshotPanelProps {
  totalActive: number;
  counts: LabTechBoardData['counts'];
  ageBuckets: LabTechBoardData['ageBuckets'];
}

const STAGE_ROWS = [
  { key: 'collection' as const, label: 'Collection' },
  { key: 'entry' as const, label: 'Entry' },
  { key: 'validation' as const, label: 'Review' },
] as const;

/**
 * Renders the current open pipeline: stage mix on the left, wait-age mix on the right.
 */
export const TodaySnapshotPanel: React.FC<TodaySnapshotPanelProps> = ({
  totalActive,
  counts,
  ageBuckets,
}) => {
  const stageSegments: DonutSegment[] = STAGE_ROWS.map(row => ({
    value: counts[row.key],
    colorClass: COMMAND_CENTER_STAGE_COLORS[row.key].fill,
  }));

  const heaviestStage = STAGE_ROWS.reduce((max, row) =>
    counts[row.key] > counts[max.key] ? row : max,
  );

  const stageLegend: MetricDonutLegendItem[] = STAGE_ROWS.map(row => ({
    colorClass: COMMAND_CENTER_STAGE_COLORS[row.key].fill,
    label: row.label,
    value: counts[row.key],
    total: totalActive,
  }));

  const ageSegments: DonutSegment[] = [
    { value: ageBuckets.fresh, colorClass: COMMAND_CENTER_AGE_COLORS.fresh },
    { value: ageBuckets.onTrack, colorClass: COMMAND_CENTER_AGE_COLORS.onTrack },
    { value: ageBuckets.warning, colorClass: COMMAND_CENTER_AGE_COLORS.warning },
    { value: ageBuckets.critical, colorClass: COMMAND_CENTER_AGE_COLORS.critical },
  ];

  const aging = ageBuckets.warning + ageBuckets.critical;

  const ageLegend: MetricDonutLegendItem[] = [
    {
      colorClass: COMMAND_CENTER_AGE_COLORS.fresh,
      label: 'Fresh',
      value: ageBuckets.fresh,
      total: totalActive,
    },
    {
      colorClass: COMMAND_CENTER_AGE_COLORS.onTrack,
      label: 'On track',
      value: ageBuckets.onTrack,
      total: totalActive,
    },
    {
      colorClass: COMMAND_CENTER_AGE_COLORS.warning,
      label: 'Waiting 4h+',
      value: ageBuckets.warning,
      total: totalActive,
    },
    {
      colorClass: COMMAND_CENTER_AGE_COLORS.critical,
      label: 'Waiting 8h+',
      value: ageBuckets.critical,
      total: totalActive,
    },
  ];

  const stageSummary =
    totalActive === 0
      ? 'No tests waiting in the pipeline.'
      : `${heaviestStage.label} holds ${counts[heaviestStage.key]} of ${totalActive} open test${
          totalActive === 1 ? '' : 's'
        }`;

  const backlogSummary =
    totalActive > 0
      ? aging > 0
        ? `${aging} test${aging === 1 ? '' : 's'} past TAT thresholds`
        : `${totalActive} active test${totalActive === 1 ? '' : 's'} — all on track`
      : 'Pipeline is clear right now.';

  const meta =
    totalActive === 0 ? 'Pipeline is clear' : `${totalActive} open in pipeline`;

  return (
    <Panel title="Today" meta={meta}>
      <PanelBody>
        <div className="grid h-full min-h-0 grid-cols-2 divide-x divide-border-subtle">
          <MetricDonutHalf
            title="By Stage"
            summary={stageSummary}
            centerLabel={String(totalActive)}
            centerDetail="open"
            segments={stageSegments}
            legend={stageLegend}
          />
          <MetricDonutHalf
            title="By Wait"
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

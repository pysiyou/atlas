/**
 * Today snapshot — live pipeline composition by stage and wait age.
 */

import React from 'react';
import { Panel, PanelBody } from '../components';
import type { DonutSegment } from '../components/DonutChart';
import type { LabTechBoardData } from '../boardTypes';
import { MetricDonutHalf, type MetricDonutLegendItem } from './MetricDonutHalf';

interface TodaySnapshotPanelProps {
  totalActive: number;
  counts: LabTechBoardData['counts'];
  ageBuckets: LabTechBoardData['ageBuckets'];
}

const STAGE_COLORS = {
  collection: 'fill-info-fg-emphasis',
  entry: 'fill-warning-fg-emphasis',
  validation: 'fill-success-fg-emphasis',
} as const;

const STAGE_ROWS = [
  { key: 'collection' as const, label: 'Collection' },
  { key: 'entry' as const, label: 'Entry' },
  { key: 'validation' as const, label: 'Review' },
] as const;

const AGE_COLORS = {
  fresh: 'fill-brand',
  onTrack: 'fill-info-fg-emphasis',
  warning: 'fill-warning-fg-emphasis',
  critical: 'fill-danger-fg-emphasis',
} as const;

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
    colorClass: STAGE_COLORS[row.key],
  }));

  const heaviestStage = STAGE_ROWS.reduce((max, row) =>
    counts[row.key] > counts[max.key] ? row : max,
  );

  const stageLegend: MetricDonutLegendItem[] = STAGE_ROWS.map(row => ({
    colorClass: STAGE_COLORS[row.key],
    label: row.label,
    value: counts[row.key],
    total: totalActive,
  }));

  const ageSegments: DonutSegment[] = [
    { value: ageBuckets.fresh, colorClass: AGE_COLORS.fresh },
    { value: ageBuckets.onTrack, colorClass: AGE_COLORS.onTrack },
    { value: ageBuckets.warning, colorClass: AGE_COLORS.warning },
    { value: ageBuckets.critical, colorClass: AGE_COLORS.critical },
  ];

  const aging = ageBuckets.warning + ageBuckets.critical;

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

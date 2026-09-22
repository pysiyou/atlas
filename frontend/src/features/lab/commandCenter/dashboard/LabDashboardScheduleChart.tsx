/**
 * Lab pipeline mix — donut chart with side legend (schedule for today panel).
 */
import React, { useMemo } from 'react';
import { EMPTY_COPY } from '@/components/display/emptyStateCopy';
import { EmptyState } from '@/components/display/EmptyState';
import { PANEL_EMPTY_STATE } from '@/components/display/emptyStatePresets';
import { Panel } from '@/components/surfaces/Panel';
import type { LabScheduleStateMix } from '../commandCenterModel';
import { DASHBOARD_CHART, SCHEDULE_STATE_CHART_COLORS } from '../dashboardStyles';

export interface LabDashboardScheduleChartProps {
  stateMix: LabScheduleStateMix;
}

type ScheduleStateKey = keyof LabScheduleStateMix;

interface StateSegmentConfig {
  key: ScheduleStateKey;
  label: string;
  color: string;
}

/** Row-major 2×N grid: col1 Pending/Resulted/Blocked, col2 Running/Validated. */
const STATE_SEGMENTS: StateSegmentConfig[] = [
  { key: 'pending', label: 'Pending', color: SCHEDULE_STATE_CHART_COLORS.pending },
  { key: 'running', label: 'Running', color: SCHEDULE_STATE_CHART_COLORS.running },
  { key: 'resulted', label: 'Resulted', color: SCHEDULE_STATE_CHART_COLORS.resulted },
  { key: 'validated', label: 'Validated', color: SCHEDULE_STATE_CHART_COLORS.validated },
  { key: 'blocked', label: 'Blocked', color: SCHEDULE_STATE_CHART_COLORS.blocked },
];

const CHART_SIZE = 168;
const STROKE_WIDTH = 18;
/** Arc gap between segments; round caps extend ~stroke/2 each side. */
const SEGMENT_GAP = 16;
/** Matches Panel `bg-surface` so gaps and track blend with the panel. */
const TRACK_COLOR = 'var(--surface)';

function buildDonutSegments(
  counts: number[],
  total: number,
): Array<{ length: number; offset: number; visible: boolean }> {
  const radius = (CHART_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  if (total <= 0) {
    return counts.map(() => ({ length: 0, offset: 0, visible: false }));
  }

  const activeCount = counts.filter(count => count > 0).length;
  const totalGap = activeCount > 0 ? SEGMENT_GAP * activeCount : 0;
  const usable = Math.max(0, circumference - totalGap);
  /** Shrink dashes so rounded end caps stay inside their slice and off the next segment. */
  const capInset = STROKE_WIDTH * 0.45;

  let cursor = 0;
  return counts.map(count => {
    if (count <= 0) {
      return { length: 0, offset: cursor, visible: false };
    }
    const proportional = (count / total) * usable;
    const length = Math.max(STROKE_WIDTH, proportional - capInset);
    const segment = { length, offset: cursor + capInset / 2, visible: true };
    cursor += proportional + SEGMENT_GAP;
    return segment;
  });
}

export const LabDashboardScheduleChart: React.FC<LabDashboardScheduleChartProps> = ({
  stateMix,
}) => {
  const segments = useMemo(
    () =>
      STATE_SEGMENTS.map(config => ({
        ...config,
        count: stateMix[config.key],
      })),
    [stateMix],
  );

  const total = useMemo(
    () => segments.reduce((sum, segment) => sum + segment.count, 0),
    [segments],
  );

  const donutGeometry = useMemo(
    () =>
      buildDonutSegments(
        segments.map(segment => segment.count),
        total,
      ),
    [segments, total],
  );

  const radius = (CHART_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = CHART_SIZE / 2;

  const ariaSummary = useMemo(() => {
    if (total === 0) {
      return 'No tests in the pipeline.';
    }
    return segments.map(segment => `${segment.label} ${segment.count}`).join(', ');
  }, [segments, total]);

  return (
    <Panel title="Schedule for Today" bodyClassName="flex flex-col justify-center">
      {total === 0 ? (
        <EmptyState
          {...PANEL_EMPTY_STATE}
          title={EMPTY_COPY.activeTests.title}
          description={EMPTY_COPY.activeTests.description}
        />
      ) : (
        <div className={DASHBOARD_CHART.donutRow}>
          <div
            className={`${DASHBOARD_CHART.donutChartWrap} bg-surface`}
            style={{ width: CHART_SIZE, height: CHART_SIZE }}
          >
            <svg
              width={CHART_SIZE}
              height={CHART_SIZE}
              viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
              className="absolute inset-0 -rotate-90"
              role="img"
              aria-label={`Lab pipeline state mix: ${ariaSummary}`}
            >
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={TRACK_COLOR}
                strokeWidth={STROKE_WIDTH}
              />
              {segments.map((segment, index) => {
                const geometry = donutGeometry[index];
                if (!geometry.visible) {
                  return null;
                }
                return (
                  <circle
                    key={segment.key}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke={segment.color}
                    strokeWidth={STROKE_WIDTH}
                    strokeLinecap="round"
                    strokeDasharray={`${geometry.length} ${circumference - geometry.length}`}
                    strokeDashoffset={-geometry.offset}
                  />
                );
              })}
            </svg>
            <div className={DASHBOARD_CHART.donutCenter} aria-hidden>
              <span className={DASHBOARD_CHART.donutCenterLabel}>Total</span>
              <span className={DASHBOARD_CHART.donutCenterValue}>{total.toLocaleString()}</span>
            </div>
          </div>

          <div className={DASHBOARD_CHART.donutLegend}>
            {segments.map(segment => (
              <div key={segment.key} className={DASHBOARD_CHART.donutLegendItem}>
                <div className={DASHBOARD_CHART.donutLegendHeading}>
                  <span
                    className={DASHBOARD_CHART.donutLegendSwatch}
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className={DASHBOARD_CHART.donutLegendLabel}>{segment.label}</span>
                </div>
                <div className={DASHBOARD_CHART.donutLegendValue}>
                  <span>{segment.count.toLocaleString()}</span>
                  <span className={DASHBOARD_CHART.donutLegendPercent}>
                    {total > 0 ? `${Math.round((segment.count / total) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
};

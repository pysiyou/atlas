/**
 * Today step averages — overlapping duration bubbles and aligned metric rows.
 */
import React, { useMemo } from 'react';
import { getStageVisual, labStageLabel } from '../../constants/labConstants';
import type { LabPipelineStage, LabTodayStepAverage } from '../commandCenterModel';
import { TODAY_STEP_CHART } from '../dashboardStyles';
import { formatStepDurationHours } from './formatStepDuration';

const STEP_ORDER: LabPipelineStage[] = ['collection', 'entry', 'validation'];

type StepVisual = LabTodayStepAverage & {
  label: string;
  barClass: string;
  bubblePositionClass: string;
  bubbleSize: number;
  displayHours: string;
  barPercent: number;
  timeSharePercent: number;
  zIndex: number;
};

function bubbleSize(hours: number, maxHours: number): number {
  if (hours <= 0 || maxHours <= 0) {
    return TODAY_STEP_CHART.bubbleMin;
  }
  const ratio = Math.min(1, hours / maxHours);
  return Math.round(
    TODAY_STEP_CHART.bubbleMin + ratio * (TODAY_STEP_CHART.bubbleMax - TODAY_STEP_CHART.bubbleMin),
  );
}

function buildStepVisuals(steps: LabTodayStepAverage[]): StepVisual[] {
  const byStep = Object.fromEntries(steps.map(step => [step.step, step])) as Partial<
    Record<LabPipelineStage, LabTodayStepAverage>
  >;

  const hoursValues = STEP_ORDER.map(step => byStep[step]?.averageHours ?? 0).filter(value => value > 0);
  const maxHours = hoursValues.length > 0 ? Math.max(...hoursValues) : 0;
  const totalTime = STEP_ORDER.reduce((sum, step) => {
    const row = byStep[step];
    if (!row?.averageHours || row.sampleCount <= 0) {
      return sum;
    }
    return sum + row.averageHours * row.sampleCount;
  }, 0);

  return STEP_ORDER.map(step => {
    const row = byStep[step] ?? { step, averageHours: null, sampleCount: 0 };
    const hours = row.averageHours ?? 0;
    const timeShare =
      totalTime > 0 && row.averageHours != null && row.sampleCount > 0
        ? Math.round(((row.averageHours * row.sampleCount) / totalTime) * 100)
        : 0;
    const { bar } = getStageVisual(step);

    return {
      ...row,
      label: labStageLabel(step, step === 'entry' ? 'short' : 'full'),
      barClass: bar,
      bubblePositionClass: TODAY_STEP_CHART.bubblePositions[step],
      bubbleSize: bubbleSize(hours, maxHours),
      displayHours: formatStepDurationHours(row.averageHours),
      barPercent: hours > 0 && maxHours > 0 ? (hours / maxHours) * 100 : 0,
      timeSharePercent: timeShare,
      zIndex: TODAY_STEP_CHART.zIndex[step],
    };
  });
}

function StepBubble({ step }: { step: StepVisual }) {
  if (step.sampleCount <= 0 || step.averageHours == null) {
    return null;
  }

  return (
    <div
      className={`${TODAY_STEP_CHART.bubble} ${TODAY_STEP_CHART.bubbleText} ${step.barClass} ${step.bubblePositionClass}`}
      style={{
        width: step.bubbleSize,
        height: step.bubbleSize,
        zIndex: step.zIndex,
      }}
      title={`${step.label}: ${step.displayHours} average · ${step.sampleCount} tests`}
    >
      <span className={TODAY_STEP_CHART.bubbleDuration}>{step.displayHours}</span>
      <span className={TODAY_STEP_CHART.bubbleLabel}>{step.label}</span>
    </div>
  );
}

function StepMetric({ step }: { step: StepVisual }) {
  const hasData = step.sampleCount > 0 && step.averageHours != null;
  const testLabel = step.sampleCount === 1 ? 'test' : 'tests';

  return (
    <li className={TODAY_STEP_CHART.metricRow}>
      <div className={TODAY_STEP_CHART.metricHead}>
        <span className={TODAY_STEP_CHART.metricLabel}>{step.label}</span>
        <span className={TODAY_STEP_CHART.metricValue}>{step.displayHours}</span>
      </div>
      <div className={TODAY_STEP_CHART.metricBarLine}>
        <span className={TODAY_STEP_CHART.metricSide}>
          {hasData ? `${step.sampleCount.toLocaleString()} ${testLabel}` : 'No tests'}
        </span>
        <div className={TODAY_STEP_CHART.metricTrack}>
          <div
            className={`${TODAY_STEP_CHART.metricFill} ${step.barClass}`}
            style={{
              width: hasData ? `${Math.max(10, step.barPercent)}%` : '0%',
            }}
          />
        </div>
        <span className={TODAY_STEP_CHART.metricSideEnd}>
          {hasData ? `${step.timeSharePercent}% of time` : '—'}
        </span>
      </div>
    </li>
  );
}

export interface LabDashboardTodayStepChartProps {
  steps: LabTodayStepAverage[];
}

export const LabDashboardTodayStepChart: React.FC<LabDashboardTodayStepChartProps> = ({ steps }) => {
  const visuals = useMemo(() => buildStepVisuals(steps), [steps]);
  const hasData = visuals.some(step => step.sampleCount > 0);

  if (!hasData) {
    return null;
  }

  return (
    <div className={TODAY_STEP_CHART.layout} role="img" aria-label="Average time per workflow step">
      <div className={TODAY_STEP_CHART.bubbleStage}>
        {visuals.map(step => (
          <StepBubble key={step.step} step={step} />
        ))}
      </div>
      <ul className={TODAY_STEP_CHART.metricStack}>
        {visuals.map(step => (
          <StepMetric key={step.step} step={step} />
        ))}
      </ul>
    </div>
  );
};

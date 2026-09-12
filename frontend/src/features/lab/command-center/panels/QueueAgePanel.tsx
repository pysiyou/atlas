/**
 * Stage wait — horizontal range bars with a shared time axis.
 * Shows average and oldest wait per pipeline step, plus where total queue time sits.
 */

import React from 'react';
import { cn } from '@/utils';
import { LAB_CONFIG } from '../../constants';
import { ColumnHeader, Panel, PanelBody } from '../components';
import {
  COMMAND_CENTER_TEXT,
} from '../components/styles';
import type { LabTechBoardData, QueueAgeStats } from '../hooks/useLabTechBoard';
import { PanelNote } from './compact';

interface QueueAgePanelProps {
  counts: LabTechBoardData['counts'];
  queueAge: LabTechBoardData['queueAge'];
  totalActive: number;
}

const { QUEUE_AGE_WARNING_HOURS: warningHours, QUEUE_AGE_CRITICAL_HOURS: criticalHours } =
  LAB_CONFIG;

const STAGES = [
  {
    key: 'collection' as const,
    label: 'Collection',
    barClass: 'bg-info-fg-emphasis',
  },
  {
    key: 'entry' as const,
    label: 'Entry',
    barClass: 'bg-warning-fg-emphasis',
  },
  {
    key: 'validation' as const,
    label: 'Review',
    barClass: 'bg-success-fg-emphasis',
  },
] as const;

type StageKey = (typeof STAGES)[number]['key'];

interface StageRow {
  key: StageKey;
  label: string;
  barClass: string;
  count: number;
  age: QueueAgeStats;
  avgHours: number;
}

function hoursLabel(hours: number | null): string {
  if (hours === null) return '—';
  if (hours < 1) return '<1h';
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

function pct(hours: number, scaleMax: number): number {
  if (scaleMax <= 0) return 0;
  return Math.min((hours / scaleMax) * 100, 100);
}

function buildStages(
  counts: LabTechBoardData['counts'],
  queueAge: LabTechBoardData['queueAge'],
): StageRow[] {
  return STAGES.map(stage => ({
    ...stage,
    count: counts[stage.key],
    age: queueAge[stage.key],
    avgHours: queueAge[stage.key].averageHours ?? 0,
  }));
}

function StageTimeComposition({ stages }: { stages: StageRow[] }) {
  const totalHours = stages.reduce((sum, stage) => sum + stage.avgHours, 0);

  if (totalHours <= 0) return null;

  const bottleneck = stages.reduce((max, stage) =>
    stage.avgHours > max.avgHours ? stage : max,
  );

  return (
    <div className="space-y-1.5">
      <ColumnHeader
        title="Time Split"
        aside={`${hoursLabel(totalHours)} total avg`}
      />

      <div className="flex h-1.5 overflow-hidden rounded-xs bg-surface-hover">
        {stages.map(stage => {
          if (stage.avgHours <= 0) return null;
          return (
            <div
              key={stage.key}
              className={cn('h-full min-w-0', stage.barClass)}
              style={{ width: `${(stage.avgHours / totalHours) * 100}%` }}
              title={`${stage.label}: ${hoursLabel(stage.avgHours)}`}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {stages.map(stage => {
          const share = totalHours > 0 ? Math.round((stage.avgHours / totalHours) * 100) : 0;
          return (
            <span key={stage.key} className={cn('flex items-center gap-1.5 text-xs', COMMAND_CENTER_TEXT.label)}>
              <span className={cn('h-2 w-2 shrink-0 rounded-sm', stage.barClass)} />
              {stage.label}{' '}
              <span className={cn('text-sm font-light tabular-nums', COMMAND_CENTER_TEXT.value)}>
                {hoursLabel(stage.avgHours)}
              </span>
              <span className={cn('tabular-nums', COMMAND_CENTER_TEXT.detail)}>({share}%)</span>
            </span>
          );
        })}
      </div>

      {bottleneck.avgHours > 0 && (
        <p className={cn('text-xs', COMMAND_CENTER_TEXT.detail)}>
          Slowest step:{' '}
          <span className={COMMAND_CENTER_TEXT.label}>{bottleneck.label}</span>
        </p>
      )}
    </div>
  );
}

function ThresholdMarkers({ scaleMax }: { scaleMax: number }) {
  const warningPct = pct(warningHours, scaleMax);
  const criticalPct = pct(criticalHours, scaleMax);

  return (
    <>
      {warningPct > 0 && warningPct < 100 && (
        <div
          className="absolute inset-y-0 z-0 w-px border-l border-dashed border-warning-fg-emphasis/60"
          style={{ left: `${warningPct}%` }}
        />
      )}
      {criticalPct > 0 && criticalPct < 100 && (
        <div
          className="absolute inset-y-0 z-0 w-px border-l border-dashed border-danger-fg-emphasis/60"
          style={{ left: `${criticalPct}%` }}
        />
      )}
    </>
  );
}

function StageWaitRow({ stage, scaleMax }: { stage: StageRow; scaleMax: number }) {
  const avgPct = pct(stage.avgHours, scaleMax);
  const oldestHours = stage.age.oldestHours ?? 0;
  const oldestPct = stage.age.oldestHours !== null ? pct(oldestHours, scaleMax) : null;
  const agingCount = stage.age.warningCount + stage.age.criticalCount;

  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)_4rem] items-center gap-2.5">
      <div className="min-w-0">
        <p className={cn('truncate text-xs', COMMAND_CENTER_TEXT.label)}>{stage.label}</p>
        <p className={cn('text-xs tabular-nums', COMMAND_CENTER_TEXT.detail)}>
          {stage.count} {stage.count === 1 ? 'test' : 'tests'}
        </p>
      </div>

      <div className="relative h-1.5 rounded-xs bg-surface-hover">
        <ThresholdMarkers scaleMax={scaleMax} />

        {avgPct > 0 && (
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-xs opacity-90',
              stage.barClass,
            )}
            style={{ width: `${avgPct}%` }}
          />
        )}

        {oldestPct !== null && oldestPct > 0 && (
          <div
            className="absolute top-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-surface bg-text-primary shadow-sm"
            style={{ left: `${oldestPct}%` }}
            title={`Oldest: ${hoursLabel(stage.age.oldestHours)}`}
          />
        )}
      </div>

      <div className="text-right">
        <p className={cn('text-sm font-light tabular-nums', COMMAND_CENTER_TEXT.value)}>
          {hoursLabel(stage.age.averageHours)}
        </p>
        <p className={cn('text-xs tabular-nums', COMMAND_CENTER_TEXT.detail)}>
          ↑{hoursLabel(stage.age.oldestHours)}
          {agingCount > 0 ? ` · ${agingCount}` : ''}
        </p>
      </div>
    </div>
  );
}

function SharedTimeAxis({ scaleMax }: { scaleMax: number }) {
  const ticks = Array.from(
    new Set([0, warningHours, criticalHours, Math.ceil(scaleMax)].filter(v => v <= scaleMax)),
  ).sort((a, b) => a - b);

  return (
    <div className="relative mt-1 h-4 border-t border-border-subtle pt-1">
      {ticks.map(tick => (
        <span
          key={tick}
          className={cn(
            'absolute top-1 -translate-x-1/2 text-xs tabular-nums',
            COMMAND_CENTER_TEXT.detail,
          )}
          style={{ left: `${pct(tick, scaleMax)}%` }}
        >
          {tick === 0 ? '0' : `${tick}h`}
        </span>
      ))}
    </div>
  );
}

export const QueueAgePanel: React.FC<QueueAgePanelProps> = ({ counts, queueAge, totalActive }) => {
  const stages = buildStages(counts, queueAge);

  const pipelineOldest = stages.reduce<number | null>((oldest, stage) => {
    if (stage.age.oldestHours === null) return oldest;
    if (oldest === null || stage.age.oldestHours > oldest) return stage.age.oldestHours;
    return oldest;
  }, null);

  const scaleMax = Math.max(criticalHours * 1.25, pipelineOldest ?? 0, warningHours, 1);
  const criticalTotal = stages.reduce((sum, stage) => sum + stage.age.criticalCount, 0);
  const totalAvgHours = stages.reduce((sum, stage) => sum + stage.avgHours, 0);

  return (
    <Panel
      title="Stage Wait"
      meta={`Per-step wait · ${warningHours}h / ${criticalHours}h thresholds`}
    >
      <PanelBody>
        <div className="flex h-full min-h-0 flex-col justify-between gap-3 overflow-hidden px-3 py-2">
          {totalActive === 0 ? (
            <PanelNote>No active tests in pipeline.</PanelNote>
          ) : (
            <>
              <StageTimeComposition stages={stages} />

              <div className="space-y-2.5">
                <ColumnHeader title="Wait Per Step" />
                {stages.map(stage => (
                  <StageWaitRow key={stage.key} stage={stage} scaleMax={scaleMax} />
                ))}
                <SharedTimeAxis scaleMax={scaleMax} />
              </div>

              <PanelNote>
                Bar = avg wait · dot = oldest item · dashed lines at {warningHours}h /{' '}
                {criticalHours}h
                {totalAvgHours > 0 ? ` · ${hoursLabel(totalAvgHours)} combined avg` : ''}
                {criticalTotal > 0 ? ` · ${criticalTotal} past ${criticalHours}h` : ''}
              </PanelNote>
            </>
          )}
        </div>
      </PanelBody>
    </Panel>
  );
};

/**
 * Today panel — per-stage queue depth, today's activity, and share of monitor universe.
 */
import type { LabTodayPanelSnapshot, LabTodayStageSnapshot } from './monitorModel';
import {
  LAB_COPY,
  getKpiStageVisual,
  type LabWorkflowStage,
} from '../constants/labConstants';

export type TodayPipelineStage = LabTodayStageSnapshot['stage'];

export interface TodayStageRowConfig {
  stage: TodayPipelineStage;
  tableLabel: string;
}

export const STAGE_ROWS: readonly TodayStageRowConfig[] = [
  { stage: 'collection', tableLabel: LAB_COPY.dashboardToday.stageCollection },
  { stage: 'entry', tableLabel: LAB_COPY.dashboardToday.stageEntry },
  { stage: 'validation', tableLabel: LAB_COPY.dashboardToday.stageValidation },
] as const;

export interface TodayStageSegment {
  stage: TodayPipelineStage;
  tableLabel: string;
  atStage: number;
  atStagePercent: number;
  touchedToday: number;
  touchedTodayPercent: number;
  barClass: string;
  textClass: string;
  iconWellClass: string;
}

export function meterPercent(count: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((count / total) * 100));
}

function stageSnapshotByKey(
  snapshot: LabTodayPanelSnapshot,
  stage: TodayPipelineStage,
): LabTodayStageSnapshot {
  const row = snapshot.stages.find(s => s.stage === stage);
  return (
    row ?? {
      stage,
      atStage: 0,
      atStagePercent: 0,
      touchedToday: 0,
      touchedTodayPercent: 0,
    }
  );
}

export function buildTodayStageSegments(snapshot: LabTodayPanelSnapshot): TodayStageSegment[] {
  return STAGE_ROWS.map(row => {
    const metrics = stageSnapshotByKey(snapshot, row.stage);
    const visual = getKpiStageVisual(row.stage as LabWorkflowStage);
    return {
      stage: row.stage,
      tableLabel: row.tableLabel,
      atStage: metrics.atStage,
      atStagePercent: metrics.atStagePercent,
      touchedToday: metrics.touchedToday,
      touchedTodayPercent: metrics.touchedTodayPercent,
      barClass: visual.bar,
      textClass: visual.text,
      iconWellClass: visual.iconWell,
    };
  });
}

export function sumAtStage(snapshot: LabTodayPanelSnapshot): number {
  return snapshot.stages.reduce((sum, row) => sum + row.atStage, 0);
}

export function formatTodayStageRowTitle(segment: TodayStageSegment, totalTests: number): string {
  return `${segment.tableLabel}: ${segment.atStage.toLocaleString()} in queue (${segment.atStagePercent}% of ${totalTests.toLocaleString()} tests), ${segment.touchedToday.toLocaleString()} touched today (${segment.touchedTodayPercent}%).`;
}

export function formatTodayStageRowAria(segment: TodayStageSegment): string {
  return `${segment.tableLabel}, ${segment.atStage.toLocaleString()} in queue, ${segment.atStagePercent} percent, ${segment.touchedToday.toLocaleString()} today, ${segment.touchedTodayPercent} percent`;
}

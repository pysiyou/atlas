/**
 * Today panel stair-track layout — milestone percentages and shared pipeline offsets.
 */
import type { LabTodayPanelSnapshot } from './monitorModel';
import {
  LAB_COPY,
  getKpiStageVisual,
  type LabWorkflowKpiStage,
} from '../constants/labConstants';

export type TodayMilestoneKey = keyof Pick<
  LabTodayPanelSnapshot,
  'testsWithCollection' | 'testsWithResultEntry' | 'testsWithValidation' | 'testsOffNormalPath'
>;

export interface TodayMilestoneRowConfig {
  key: TodayMilestoneKey;
  tableLabel: string;
  stage: LabWorkflowKpiStage;
}

export const MILESTONE_ROWS: readonly TodayMilestoneRowConfig[] = [
  {
    key: 'testsWithCollection',
    tableLabel: LAB_COPY.dashboardToday.withCollection,
    stage: 'collection',
  },
  {
    key: 'testsWithResultEntry',
    tableLabel: LAB_COPY.dashboardToday.withEntry,
    stage: 'entry',
  },
  {
    key: 'testsWithValidation',
    tableLabel: LAB_COPY.dashboardToday.withValidation,
    stage: 'validation',
  },
  {
    key: 'testsOffNormalPath',
    tableLabel: LAB_COPY.dashboardToday.withQualityRework,
    stage: 'sentBack',
  },
] as const;

/** Horizontal reserve per table row on the shared stair track (~size-1 dot). */
export const STAIR_ROW_STEP_PERCENT = 2;

export interface TodayStairSegment {
  key: TodayMilestoneKey;
  tableLabel: string;
  stage: LabWorkflowKpiStage;
  count: number;
  percentOfWorked: number;
  stairOffset: number;
  stairWidth: number;
  barClass: string;
  textClass: string;
  iconWellClass: string;
}

export interface TodayPanelLeadMilestone {
  tableLabel: string;
  count: number;
  textClass: string;
}

export interface TodayPanelInsights {
  leadMilestone: TodayPanelLeadMilestone | null;
  reworkRate: number;
  milestoneEventTotal: number;
  showReworkHint: boolean;
  showHighChurnHint: boolean;
}

export function meterPercent(count: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((count / total) * 100));
}

export function stairTrackConsumed(
  percentOfWorked: number,
  stairOffset: number,
  rowsAfter: number,
): number {
  const reservedTail = rowsAfter * STAIR_ROW_STEP_PERCENT;
  const room = Math.max(0, 100 - stairOffset - reservedTail);
  if (room <= 0) {
    return 0;
  }
  if (percentOfWorked <= 0) {
    return Math.min(STAIR_ROW_STEP_PERCENT, room);
  }
  const desired = Math.max(percentOfWorked, STAIR_ROW_STEP_PERCENT);
  return Math.min(desired, room);
}

export function stairMarkOffset(stairOffset: number): number {
  return Math.min(stairOffset, 100 - STAIR_ROW_STEP_PERCENT);
}

export function buildTodayStairSegments(snapshot: LabTodayPanelSnapshot): TodayStairSegment[] {
  const totalWorked = snapshot.testsUpdatedToday;
  let stairOffset = 0;

  return MILESTONE_ROWS.map((row, index) => {
    const count = snapshot[row.key];
    const visual = getKpiStageVisual(row.stage);
    const percentOfWorked = meterPercent(count, totalWorked);
    const rowsAfter = MILESTONE_ROWS.length - 1 - index;
    const consumed = stairTrackConsumed(percentOfWorked, stairOffset, rowsAfter);
    const markOffset = stairMarkOffset(stairOffset);
    const stairWidth = percentOfWorked <= 0 ? 0 : consumed;

    if (consumed > 0) {
      stairOffset += consumed;
    } else {
      stairOffset = Math.min(100, stairOffset + STAIR_ROW_STEP_PERCENT);
    }

    return {
      key: row.key,
      tableLabel: row.tableLabel,
      stage: row.stage,
      count,
      percentOfWorked,
      stairOffset: markOffset,
      stairWidth,
      barClass: visual.bar,
      textClass: visual.text,
      iconWellClass: visual.iconWell,
    };
  });
}

export function deriveTodayInsights(snapshot: LabTodayPanelSnapshot): TodayPanelInsights {
  const totalWorked = snapshot.testsUpdatedToday;
  const milestoneEventTotal =
    snapshot.testsWithCollection +
    snapshot.testsWithResultEntry +
    snapshot.testsWithValidation +
    snapshot.testsOffNormalPath;

  const reworkRate = meterPercent(snapshot.testsOffNormalPath, totalWorked);

  let leadMilestone: TodayPanelLeadMilestone | null = null;
  if (totalWorked > 0) {
    let bestCount = -1;
    for (const row of MILESTONE_ROWS) {
      const count = snapshot[row.key];
      if (count > bestCount) {
        bestCount = count;
        const visual = getKpiStageVisual(row.stage);
        leadMilestone = {
          tableLabel: row.tableLabel,
          count,
          textClass: visual.text,
        };
      }
    }
    if (bestCount <= 0) {
      leadMilestone = null;
    }
  }

  return {
    leadMilestone,
    reworkRate,
    milestoneEventTotal,
    showReworkHint: totalWorked > 0 && reworkRate >= 10,
    showHighChurnHint: totalWorked > 0 && milestoneEventTotal > totalWorked * 1.25,
  };
}

export function formatTodayRowTitle(
  tableLabel: string,
  count: number,
  totalWorked: number,
  percentOfWorked: number,
): string {
  return `${tableLabel}: ${count.toLocaleString()} of ${totalWorked.toLocaleString()} tests worked today (${percentOfWorked}%). ${LAB_COPY.dashboardToday.rowTitleOverlapNote}`;
}

export function formatTodayRowAriaLabel(
  tableLabel: string,
  count: number,
  percentOfWorked: number,
): string {
  return `${tableLabel}, ${percentOfWorked} percent, ${count.toLocaleString()} tests`;
}

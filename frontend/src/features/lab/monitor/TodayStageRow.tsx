/**
 * Pipeline stage row — in-queue vs today's activity (counts and % of monitor view).
 */
import React from 'react';
import { METER_KPI } from '@/theme/recipes';
import {
  formatTodayStageRowAria,
  formatTodayStageRowTitle,
  type TodayStageSegment,
} from './todayPanelStairLayout';
import { cn } from '@/utils';

export interface TodayStageRowProps {
  segment: TodayStageSegment;
  totalTests: number;
}

export const TodayStageRow: React.FC<TodayStageRowProps> = ({ segment, totalTests }) => {
  const rowTitle = formatTodayStageRowTitle(segment, totalTests);
  const rowAria = formatTodayStageRowAria(segment);

  return (
    <div
      className={METER_KPI.tableRowStage}
      role="row"
      title={rowTitle}
      aria-label={rowAria}
    >
      <div className={METER_KPI.rowLabelWrap} role="cell">
        <div className={METER_KPI.pipelineRailCell} aria-hidden>
          <span className={cn(METER_KPI.stageChip, segment.barClass)} />
        </div>
        <span className={METER_KPI.tableLabel}>{segment.tableLabel}</span>
      </div>

      <span className={METER_KPI.tableMetricCell} role="cell">
        <span className={METER_KPI.tablePercent}>{segment.atStagePercent}%</span>
        <span className={METER_KPI.tableCount}> · {segment.atStage.toLocaleString()}</span>
      </span>

      <span className={METER_KPI.tableMetricCell} role="cell">
        <span className={METER_KPI.tablePercent}>{segment.touchedTodayPercent}%</span>
        <span className={METER_KPI.tableCount}> · {segment.touchedToday.toLocaleString()}</span>
      </span>

      <span className={METER_KPI.tableMetricCell} role="cell">
        <span className={METER_KPI.tablePercent}>{segment.atStagePercent}%</span>
        <span className={METER_KPI.tableCount}> / {segment.touchedTodayPercent}%</span>
      </span>
    </div>
  );
};

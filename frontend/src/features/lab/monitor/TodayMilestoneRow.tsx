/**
 * Single milestone row — pipeline chip, stair activity meter, and share column.
 */
import React from 'react';
import { METER_KPI } from '@/theme/recipes';
import {
  formatTodayRowAriaLabel,
  formatTodayRowTitle,
  type TodayStairSegment,
} from './todayPanelStairLayout';
import { cn } from '@/utils';

export interface TodayMilestoneRowProps {
  segment: TodayStairSegment;
  totalWorked: number;
  isLast: boolean;
}

export const TodayMilestoneRow: React.FC<TodayMilestoneRowProps> = ({
  segment,
  totalWorked,
  isLast,
}) => {
  const rowTitle = formatTodayRowTitle(
    segment.tableLabel,
    segment.count,
    totalWorked,
    segment.percentOfWorked,
  );
  const rowAria = formatTodayRowAriaLabel(
    segment.tableLabel,
    segment.count,
    segment.percentOfWorked,
  );

  return (
    <div
      className={METER_KPI.tableRow}
      role="row"
      title={rowTitle}
      aria-label={rowAria}
    >
      <div className={METER_KPI.rowLabelWrap} role="cell">
        <div className={METER_KPI.pipelineRailCell} aria-hidden>
          <span className={cn(METER_KPI.stageChip, segment.barClass)} />
          {!isLast ? <span className={METER_KPI.pipelineRailLine} /> : null}
        </div>
        <span className={METER_KPI.tableLabel}>{segment.tableLabel}</span>
      </div>
      <div className={METER_KPI.tableRowMeterTrack} role="presentation" aria-hidden>
        <div className={METER_KPI.stairGhostTrack} />
        {segment.stairWidth > 0 ? (
          <div
            className={cn(METER_KPI.tableRowMeterFill, segment.barClass)}
            style={{
              left: `${segment.stairOffset}%`,
              width: `${segment.stairWidth}%`,
            }}
          />
        ) : (
          <div
            className={cn(METER_KPI.tableRowMeterDot, segment.barClass)}
            style={{ left: `${segment.stairOffset}%` }}
          />
        )}
      </div>
      <span className={METER_KPI.tableValue} role="cell">
        <span className={METER_KPI.tablePercent}>{segment.percentOfWorked}%</span>
        <span className={METER_KPI.tableCount}>
          {' '}
          · {segment.count.toLocaleString()}
        </span>
      </span>
    </div>
  );
};

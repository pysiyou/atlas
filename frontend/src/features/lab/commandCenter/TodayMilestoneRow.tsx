/**
 * Single milestone row — pipeline chip, stair activity meter, and share column.
 */
import React from 'react';
import { TODAY_KPI } from './commandCenterStyles';
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
      className={TODAY_KPI.tableRow}
      role="row"
      title={rowTitle}
      aria-label={rowAria}
    >
      <div className={TODAY_KPI.rowLabelWrap} role="cell">
        <div className={TODAY_KPI.pipelineRailCell} aria-hidden>
          <span className={cn(TODAY_KPI.stageChip, segment.barClass)} />
          {!isLast ? <span className={TODAY_KPI.pipelineRailLine} /> : null}
        </div>
        <span className={TODAY_KPI.tableLabel}>{segment.tableLabel}</span>
      </div>
      <div className={TODAY_KPI.tableRowMeterTrack} role="presentation" aria-hidden>
        <div className={TODAY_KPI.stairGhostTrack} />
        {segment.stairWidth > 0 ? (
          <div
            className={cn(TODAY_KPI.tableRowMeterFill, segment.barClass)}
            style={{
              left: `${segment.stairOffset}%`,
              width: `${segment.stairWidth}%`,
            }}
          />
        ) : (
          <div
            className={cn(TODAY_KPI.tableRowMeterDot, segment.barClass)}
            style={{ left: `${segment.stairOffset}%` }}
          />
        )}
      </div>
      <span className={TODAY_KPI.tableValue} role="cell">
        <span className={TODAY_KPI.tablePercent}>{segment.percentOfWorked}%</span>
        <span className={TODAY_KPI.tableCount}>
          {' '}
          · {segment.count.toLocaleString()}
        </span>
      </span>
    </div>
  );
};

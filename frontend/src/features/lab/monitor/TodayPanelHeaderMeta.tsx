/**
 * Header meta for the Today panel — UTC day label and monitor universe size.
 */
import React from 'react';
import { METER_KPI } from '@/theme/recipes';
import { LAB_COPY } from '../constants/labConstants';

export interface TodayPanelHeaderMetaProps {
  headerRange: string;
  totalTests: number;
  testsUpdatedToday: number;
}

export const TodayPanelHeaderMeta: React.FC<TodayPanelHeaderMetaProps> = ({
  headerRange,
  totalTests,
  testsUpdatedToday,
}) => {
  if (totalTests <= 0) {
    return <span className={METER_KPI.headerRange}>{headerRange}</span>;
  }

  return (
    <div className={METER_KPI.headerEndWrap}>
      <span className={METER_KPI.headerRange}>{headerRange}</span>
      <span className={METER_KPI.headerInsight}>
        {totalTests.toLocaleString()} {LAB_COPY.dashboardToday.headerUniverse}
      </span>
      {testsUpdatedToday > 0 ? (
        <span className={METER_KPI.headerInsightMuted}>
          {testsUpdatedToday.toLocaleString()} {LAB_COPY.dashboardToday.testsWorked}
        </span>
      ) : null}
    </div>
  );
};

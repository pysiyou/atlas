/**
 * Header meta for the Today panel — UTC day label and monitor universe size.
 */
import { METER_KPI } from '@/theme/recipes';
import { getLabCopy } from '@/strings';

export interface TodayPanelHeaderMetaProps {
  headerRange: string;
  totalTests: number;
  testsUpdatedToday: number;
}

export function TodayPanelHeaderMeta({
  headerRange,
  totalTests,
  testsUpdatedToday,
}: TodayPanelHeaderMetaProps) {
  if (totalTests <= 0) {
    return <span className={METER_KPI.headerRange}>{headerRange}</span>;
  }

  return (
    <div className={METER_KPI.headerEndWrap}>
      <span className={METER_KPI.headerRange}>{headerRange}</span>
      <span className={METER_KPI.headerInsight}>
        {totalTests.toLocaleString()} {getLabCopy().dashboardToday.headerUniverse}
      </span>
      {testsUpdatedToday > 0 ? (
        <span className={METER_KPI.headerInsightMuted}>
          {testsUpdatedToday.toLocaleString()} {getLabCopy().dashboardToday.testsWorked}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Header meta for the Today panel — UTC day label and monitor universe size.
 */
import { METER_KPI } from '@/theme/recipes';
import { useLabCopy } from '@/strings';

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
  const labCopy = useLabCopy();
  if (totalTests <= 0) {
    return <span className={METER_KPI.headerRange}>{headerRange}</span>;
  }

  return (
    <div className={METER_KPI.headerEndWrap}>
      <span className={METER_KPI.headerRange}>{headerRange}</span>
      <span className={METER_KPI.headerInsight}>
        {totalTests.toLocaleString()} {labCopy.dashboardToday.headerUniverse}
      </span>
      {testsUpdatedToday > 0 ? (
        <span className={METER_KPI.headerInsightMuted}>
          {testsUpdatedToday.toLocaleString()} {labCopy.dashboardToday.testsWorked}
        </span>
      ) : null}
    </div>
  );
}

/**
 * CommandCenterView - Lab Command Center 3-row layout (20% / 40% / 40%).
 * Row 1: single column, horizontal scroll for metric cards.
 */

import React from 'react';
import {
  useLabOperationLogs,
  useTestsReceivedAndValidatedByDay,
  useActivityByDay,
  useDistributionByCategory,
} from './hooks';
import {
  CommandCenterMetricCard,
  ActivitiesTimeline,
  ActivityTrendChart,
  StackedBarChart,
  DistributionPieChart,
} from './components';

const rowCellClass =
  'min-h-0 min-w-[180px] overflow-hidden border-border-default flex items-center justify-center border-r last:border-r-0';
const chartCellClass =
  'min-h-0 min-w-[240px] overflow-hidden border-border-default flex items-center justify-center border-r last:border-r-0';

const LAST_DAYS = 10;

const ACTIVITY_STACKED_SEGMENTS = [
  { dataKey: 'sampling', color: 'var(--chart-brand)', name: 'Sampling' },
  { dataKey: 'resultEntered', color: 'var(--chart-success)', name: 'Result entered' },
  { dataKey: 'validated', color: 'var(--primitive-warning-500)', name: 'Validated' },
];

export const CommandCenterView: React.FC = () => {
  const { logs, isLoading: logsLoading } = useLabOperationLogs({ limit: 50, hoursBack: 24 });
  const { data: testsReceivedAndValidatedData, isLoading: trendLoading } = useTestsReceivedAndValidatedByDay(LAST_DAYS);
  const { data: activityByDayData, isLoading: activityLoading } = useActivityByDay(LAST_DAYS);

  const { data: distributionByCategoryData, isLoading: distributionLoading } = useDistributionByCategory();

  const stackedBarData = React.useMemo(
    () =>
      activityByDayData.map((p) => ({
        label: p.date,
        sampling: p.sampling,
        resultEntered: p.resultEntered,
        validated: p.validated,
      })),
    [activityByDayData]
  );

  return (
    <div
      className="flex-1 min-h-0 min-w-[720px] overflow-hidden grid"
      style={{ gridTemplateRows: '10fr 40fr 50fr' }}
    >
      {/* Row 1: single column, horizontal scroll for metric cards */}
      <div className="min-h-0 min-w-0 overflow-x-auto overflow-y-hidden border-b border-border-default">
        <div className="flex h-full items-stretch gap-2 p-2 w-max min-w-full">
          <CommandCenterMetricCard
            title="Price"
            primaryValue="31"
            changeValue="+234,43"
            trend="down"
          />
        </div>
      </div>
      {/* Row 2: 3 equal columns */}
      <div
        className="min-h-0 min-w-0 overflow-hidden border-b border-border-default grid"
        style={{ gridTemplateColumns: '1fr 1fr 1fr' }}
      >
        <div className={`${chartCellClass} flex flex-col items-stretch justify-stretch p-2 min-w-0`}>
          <ActivityTrendChart
            title="Received vs validated"
            subTitle={`last ${LAST_DAYS} days`}
            data={trendLoading ? [] : testsReceivedAndValidatedData}
            valueLabel="tests"
          />
        </div>
        <div className={`${chartCellClass} flex flex-col items-stretch min-h-0 p-2 min-w-0`}>
          <StackedBarChart
            title="Activity by day"
            subTitle={`last ${LAST_DAYS} days`}
            valueLabel=""
            valueFormatter={(val) => val.toLocaleString()}
            segments={ACTIVITY_STACKED_SEGMENTS}
            data={activityLoading ? [] : stackedBarData}
          />
        </div>
        <div className={`${chartCellClass} flex flex-col items-stretch min-h-0 p-2 min-w-0`}>
          <DistributionPieChart
            title="Distribution by Category"
            subTitle="this year"
            data={distributionLoading ? [] : distributionByCategoryData}
          />
        </div>
      </div>
      {/* Row 3: 3/8 + 5/8 */}
      <div
        className="min-h-0 min-w-0 overflow-hidden grid"
        style={{ gridTemplateColumns: '3fr 5fr' }}
      >
        <div className={`${rowCellClass} flex min-w-[260px] flex-col items-stretch justify-stretch p-2 min-h-0`}>
          <div className="flex-1 min-h-0 min-w-0 flex flex-col">
            <ActivitiesTimeline logs={logs} isLoading={logsLoading} className="w-full" />
          </div>
        </div>
        <div className={rowCellClass} />
      </div>
    </div>
  );
};

/**
 * CommandCenterView - Lab Command Center 2-row layout (charts + timeline).
 * Single data source: useCommandCenterData (one loading state, one type).
 */

import React from 'react';
import { useCommandCenterData } from './hooks';
import {
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
  const {
    isLoading,
    logs,
    receivedValidatedByDay,
    activityByDay,
    distributionByStage,
  } = useCommandCenterData({ lastDays: LAST_DAYS, logsLimit: 50, logsHoursBack: 24 });

  const stackedBarData = React.useMemo(
    () =>
      activityByDay.map((p) => ({
        label: p.date,
        sampling: p.sampling,
        resultEntered: p.resultEntered,
        validated: p.validated,
      })),
    [activityByDay]
  );

  return (
    <div
      className="flex-1 min-h-0 min-w-[720px] overflow-hidden grid"
      style={{ gridTemplateRows: '4fr 6fr' }}
    >
      {/* Row 1: pie chart col 1, timeline col 2 */}
      <div
        className="min-h-0 min-w-0 overflow-hidden border-b border-border-default grid"
        style={{ gridTemplateColumns: '1fr 1fr' }}
      >
        <div className={`${chartCellClass} flex flex-col items-stretch justify-stretch p-2 min-w-0`}>
          <DistributionPieChart
            title="Distribution by stage"
            subTitle="this year"
            valueLabel="tests"
            data={isLoading ? [] : distributionByStage}
          />
        </div>
        <div className={`${rowCellClass} flex min-w-0 flex-col items-stretch justify-stretch p-2 min-h-0`}>
          <div className="flex-1 min-h-0 min-w-0 flex flex-col">
            <ActivitiesTimeline logs={logs} isLoading={isLoading} className="w-full" />
          </div>
        </div>
      </div>
      {/* Row 2: trend chart, stacked bar */}
      <div
        className="min-h-0 min-w-0 overflow-hidden grid"
        style={{ gridTemplateColumns: '1fr 1fr' }}
      >
        <div className={`${chartCellClass} flex flex-col items-stretch min-h-0 p-2 min-w-0`}>
          <ActivityTrendChart
            title="Received vs validated"
            subTitle={`last ${LAST_DAYS} days`}
            data={isLoading ? [] : receivedValidatedByDay}
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
            data={isLoading ? [] : stackedBarData}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * CommandCenterView - Lab Command Center 3-row layout (20% / 40% / 40%).
 * Row 1: Sampling (X of total), Result entry, Validation. Totals = completed today + still pending; trend = count-based (e.g. "X more samples today").
 */

import React from 'react';
import {
  useCommandCenterRow1Metrics,
  useLabOperationLogs,
  useTestsReceivedAndValidatedByDay,
  useActivityByDay,
} from './hooks';
import {
  CommandCenterMetricCard,
  ActivitiesTimeline,
  ActivityTrendChart,
  StackedBarChart,
  DistributionPieChart,
} from './components';
import { ICONS } from '@/utils';

const rowCellClass =
  'min-h-0 overflow-hidden border-stroke flex items-center justify-center border-r last:border-r-0';

const LAST_DAYS = 15;

const ACTIVITY_STACKED_SEGMENTS = [
  { dataKey: 'sampling', color: 'var(--chart-brand)', name: 'Sampling' },
  { dataKey: 'resultEntered', color: 'var(--chart-success)', name: 'Result entered' },
  { dataKey: 'validated', color: 'var(--primitive-warning-500)', name: 'Validated' },
];

export const CommandCenterView: React.FC = () => {
  const row1 = useCommandCenterRow1Metrics();
  const { logs, isLoading: logsLoading } = useLabOperationLogs({ limit: 50, hoursBack: 24 });
  const { data: testsReceivedAndValidatedData, isLoading: trendLoading } = useTestsReceivedAndValidatedByDay(LAST_DAYS);
  const { data: activityByDayData, isLoading: activityLoading } = useActivityByDay(LAST_DAYS);

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
      className="flex-1 min-h-0 overflow-hidden grid"
      style={{ gridTemplateRows: '20fr 40fr 40fr' }}
    >
      {/* Row 1: Sampling (X of total), Result entry, Validation — totals = completed + pending; trend = count-based */}
      <div className="min-h-0 overflow-hidden border-b border-stroke grid grid-cols-3">
        <div className={`${rowCellClass} flex items-stretch p-2`}>
          <CommandCenterMetricCard
            title="Sampled today"
            primaryValue={row1.isLoading ? '—' : row1.samplingDoneToday}
            secondaryValue={row1.isLoading ? '—' : row1.samplingTotal}
            icon={ICONS.dataFields.flask}
            trend={{ value: row1.samplesCreatedToday, label: 'more samples today', format: 'count' }}
          />
        </div>
        <div className={`${rowCellClass} flex items-stretch p-2`}>
          <CommandCenterMetricCard
            title="Result entry"
            primaryValue={row1.isLoading ? '—' : row1.resultEnteredToday}
            secondaryValue={row1.isLoading ? '—' : row1.resultTotal}
            icon={ICONS.dataFields.notebook}
            trend={{ value: row1.resultEntryQueueEnteredToday, label: 'entered result-entry today', format: 'count' }}
          />
        </div>
        <div className={`${rowCellClass} flex items-stretch p-2`}>
          <CommandCenterMetricCard
            title="Validation"
            primaryValue={row1.isLoading ? '—' : row1.validatedToday}
            secondaryValue={row1.isLoading ? '—' : row1.validationTotalDisplay}
            icon={ICONS.ui.shieldCheck}
            trend={{ value: row1.validationQueueEnteredToday, label: 'entered validation today', format: 'count' }}
          />
        </div>
      </div>
      {/* Row 2: 3 equal columns */}
      <div
        className="min-h-0 overflow-hidden border-b border-stroke grid"
        style={{ gridTemplateColumns: '1fr 1fr 1fr' }}
      >
        <div className={`${rowCellClass} flex flex-col items-stretch! justify-stretch! p-2`}>
          <ActivityTrendChart
            title="Received vs validated"
            subTitle={`last ${LAST_DAYS} days`}
            data={trendLoading ? [] : testsReceivedAndValidatedData}
            valueLabel="tests"
          />
        </div>
        <div className={`${rowCellClass} flex flex-col items-stretch min-h-0 p-2 min-w-0`}>
          <StackedBarChart
            title="Activity by day"
            subTitle={`last ${LAST_DAYS} days`}
            valueLabel=""
            valueFormatter={(val) => val.toLocaleString()}
            segments={ACTIVITY_STACKED_SEGMENTS}
            data={activityLoading ? [] : stackedBarData}
          />
        </div>
        <div className={`${rowCellClass} flex flex-col items-stretch min-h-0 p-2 min-w-0`}>
          <DistributionPieChart
            title="Distribution by Category"
            subTitle="this year"
            data={[
              { name: 'Hematology', value: 400 },
              { name: 'Chemistry', value: 300 },
              { name: 'Microbiology', value: 300 },
              { name: 'Immunology', value: 200 },
            ]}
          />
        </div>
      </div>
      {/* Row 3: 3/8 + 5/8 */}
      <div
        className="min-h-0 overflow-hidden grid"
        style={{ gridTemplateColumns: '3fr 5fr' }}
      >
        <div className={`${rowCellClass} flex flex-col items-stretch! justify-stretch! p-2 min-h-0`}>
          <div className="flex-1 min-h-0 min-w-0 flex flex-col">
            <ActivitiesTimeline logs={logs} isLoading={logsLoading} className="w-full" />
          </div>
        </div>
        <div className={rowCellClass} />
      </div>
    </div>
  );
};

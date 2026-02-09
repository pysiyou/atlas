/**
 * CommandCenterView - Lab Command Center 3-row layout (20% / 40% / 40%).
 * Row 1: Sampling (X of total), Result entry, Validation. Totals = completed today + still pending; trend = count-based (e.g. "X more samples today").
 */

import React from 'react';
import { useCommandCenterRow1Metrics, useLabOperationLogs, useTestsReceivedAndValidatedByDay } from './hooks';
import {
  CommandCenterMetricCard,
  ActivitiesTimeline,
  ActivityTrendChart,
  StackedBarChart,
  type StackedBarChartDataPoint,
} from './components';
import { ICONS } from '@/utils';

const rowCellClass =
  'min-h-0 overflow-hidden border-stroke flex items-center justify-center border-r last:border-r-0';

const LAST_DAYS = 15;

/** Mock stacked bar data (15 days); replace with real data later. */
const ACTIVITY_STACKED_MOCK: StackedBarChartDataPoint[] = [
  { label: '01/01', segment1: 2400, segment2: 1200, segment3: 600 },
  { label: '02/01', segment1: 1800, segment2: 900, segment3: 400 },
  { label: '03/01', segment1: 2100, segment2: 1100, segment3: 500 },
  { label: '04/01', segment1: 2800, segment2: 1400, segment3: 700 },
  { label: '05/01', segment1: 2200, segment2: 1000, segment3: 550 },
  { label: '06/01', segment1: 1900, segment2: 950, segment3: 450 },
  { label: '07/01', segment1: 2000, segment2: 1050, segment3: 480 },
  { label: '08/01', segment1: 3500, segment2: 1200, segment3: 600 },
  { label: '09/01', segment1: 2100, segment2: 1100, segment3: 500 },
  { label: '10/01', segment1: 3200, segment2: 900, segment3: 400 },
  { label: '11/01', segment1: 4100, segment2: 1400, segment3: 550 },
  { label: '12/01', segment1: 3800, segment2: 1000, segment3: 450 },
  { label: '13/01', segment1: 3500, segment2: 1150, segment3: 480 },
  { label: '14/01', segment1: 4200, segment2: 1300, segment3: 600 },
  { label: '15/01', segment1: 3900, segment2: 1050, segment3: 520 },
];

export const CommandCenterView: React.FC = () => {
  const row1 = useCommandCenterRow1Metrics();
  const { logs, isLoading: logsLoading } = useLabOperationLogs({ limit: 50, hoursBack: 24 });
  const { data: testsReceivedAndValidatedData, isLoading: trendLoading } = useTestsReceivedAndValidatedByDay(LAST_DAYS);

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
      {/* Row 2: 2/3 + 1/3 */}
      <div
        className="min-h-0 overflow-hidden border-b border-stroke grid"
        style={{ gridTemplateColumns: '2fr 1fr' }}
      >
        <div className={`${rowCellClass} flex flex-col items-stretch! justify-stretch! p-2`}>
          <ActivityTrendChart
            title="Received vs validated"
            subTitle={`last ${LAST_DAYS} days`}
            data={trendLoading ? [] : testsReceivedAndValidatedData}
            valueLabel="tests"
          />
        </div>
        <div className={`${rowCellClass} flex flex-col items-stretch! justify-stretch! p-2 min-h-0`}>
          <div className="flex-1 min-h-0 min-w-0 flex flex-col">
            <ActivitiesTimeline logs={logs} isLoading={logsLoading} className="w-full" />
          </div>
        </div>
      </div>
      {/* Row 3: 3/8 + 5/8 */}
      <div
        className="min-h-0 overflow-hidden grid"
        style={{ gridTemplateColumns: '3fr 5fr' }}
      >
        <div className={`${rowCellClass} flex flex-col items-stretch min-h-0 p-2 min-w-0`}>
          <StackedBarChart
            title="Activity by day"
            subTitle="this year"
            valueLabel=""
            valueFormatter={(val) => val.toLocaleString()}
            segments={[
              { dataKey: 'segment1', color: 'var(--chart-brand)', name: 'Segment 1' },
              { dataKey: 'segment2', color: 'var(--chart-success)', name: 'Segment 2' },
              { dataKey: 'segment3', color: 'var(--primitive-warning-500)', name: 'Segment 3' },
            ]}
            data={ACTIVITY_STACKED_MOCK}
          />
        </div>
        <div className={`${rowCellClass} flex flex-col min-h-0 p-2`} />
      </div>
    </div>
  );
};

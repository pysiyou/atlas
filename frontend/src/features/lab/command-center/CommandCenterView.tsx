/**
 * CommandCenterView - Lab Command Center 3-row layout (20% / 40% / 40%).
 * Row 1: Sampling (X of total), Result entry, Validation. Totals = completed today + still pending; trend = count-based (e.g. "X more samples today").
 */

import React from 'react';
import { useCommandCenterRow1Metrics, useLabOperationLogs, useTestsReceivedAndValidatedByDay } from './hooks';
import { CommandCenterMetricCard, ActivitiesTimeline, ActivityTrendChart, SimpleBarChart } from './components';
import { ICONS } from '@/utils';

const rowCellClass =
  'min-h-0 overflow-hidden border-stroke flex items-center justify-center border-r last:border-r-0';

const LAST_DAYS = 15;

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
        <div className={`${rowCellClass} flex flex-col min-h-0 p-2`}>
          <SimpleBarChart
            title="Activity by day"
            subTitle="this year"
            valueLabel="EUR"
            valueFormatter={(val) => `€${val.toLocaleString()}`}
            data={[
              { label: 'Jan', value: 4500 },
              { label: 'Feb', value: 3200 },
              { label: 'Mar', value: 4100 },
              { label: 'Apr', value: 4800 },
              { label: 'May', value: 3500 },
              { label: 'Jun', value: 4200 },
              { label: 'Jul', value: 3800 },
              { label: 'Aug', value: 3500 },
              { label: 'Sep', value: 4100 },
              { label: 'Oct', value: 3200 },
              { label: 'Nov', value: 3800 },
              { label: 'Dec', value: 4200 },
            ]}
          />
        </div>
        <div className={`${rowCellClass} flex flex-col min-h-0 p-2`} />
      </div>
    </div>
  );
};

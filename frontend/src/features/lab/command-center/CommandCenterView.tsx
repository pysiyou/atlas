/**
 * CommandCenterView - Lab Command Center 3-row layout (20% / 40% / 40%).
 * Row 1: Sampling (X of total), Result entry, Validation. Totals = completed today + still pending; trend = count-based (e.g. "X more samples today").
 */

import React, { useMemo } from 'react';
import { TableCore } from '@/shared/ui';
import { useWorkflowStateCounts, useCommandCenterRow1Metrics, useCommandCenterActivityRows } from './hooks';
import { VennBubbles, CommandCenterMetricCard, WeeklyActivitiesChart, LabHistoryTimeline } from './components';
import type { VennIntersection } from './components';
import { createLabSegments } from './utils';
import { commandCenterActivityColumns } from './commandCenterActivityTableConfig';
import { ICONS } from '@/utils';

const rowCellClass =
  'min-h-0 overflow-hidden border-border-default flex items-center justify-center border-r last:border-r-0';

export const CommandCenterView: React.FC = () => {
  const {
    samplingPct,
    entryPct,
    validationPct,
    samplingEntryPct,
    entryValidationPct,
    samplingValidationPct,
    isLoading,
  } = useWorkflowStateCounts();

  const row1 = useCommandCenterRow1Metrics();

  const segments = useMemo(
    () => createLabSegments(samplingPct, entryPct, validationPct),
    [samplingPct, entryPct, validationPct]
  );

  const intersections: VennIntersection[] = useMemo(() => [
    { segmentIds: ['sampling', 'entry'], value: samplingEntryPct },
    { segmentIds: ['entry', 'validation'], value: entryValidationPct },
    { segmentIds: ['sampling', 'validation'], value: samplingValidationPct },
  ], [samplingEntryPct, entryValidationPct, samplingValidationPct]);

  const { rows: activityRows, isLoading: activityLoading } = useCommandCenterActivityRows();

  return (
    <div
      className="flex-1 min-h-0 overflow-hidden grid"
      style={{ gridTemplateRows: '20fr 40fr 40fr' }}
    >
      {/* Row 1: Sampling (X of total), Result entry, Validation — totals = completed + pending; trend = count-based */}
      <div className="min-h-0 overflow-hidden border-b border-border-default grid grid-cols-3">
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
        className="min-h-0 overflow-hidden border-b border-border-default grid"
        style={{ gridTemplateColumns: '2fr 1fr' }}
      >
        <div className={`${rowCellClass} flex flex-col items-stretch! justify-stretch! p-2`}>
          <WeeklyActivitiesChart />
        </div>
        <div className={`${rowCellClass} flex flex-col items-stretch! justify-stretch! p-2 min-h-0`}>
          <div className="flex-1 min-h-0 min-w-0 flex flex-col ">
            <VennBubbles
              segments={segments}
              intersections={intersections}
              isLoading={isLoading}
              emptyMessage="No operations in progress"
            />
          </div>
        </div>
      </div>
      {/* Row 3: 3/8 + 5/8 */}
      <div
        className="min-h-0 overflow-hidden grid"
        style={{ gridTemplateColumns: '3fr 5fr' }}
      >
        <div className={`${rowCellClass} flex flex-col min-h-0`}>
          <LabHistoryTimeline />
        </div>
        <div className={`${rowCellClass} flex flex-col min-h-0 p-2`}>
          <TableCore
            data={activityRows}
            columns={commandCenterActivityColumns}
            showHeader={false}
            pagination={false}
            maxHeight="100%"
            embedded
            loading={activityLoading}
            emptyMessage="No recent activity"
            getRowKey={(row, i) => `${row.orderId}-${row.testCode}-${row.sampleId ?? 0}-${i}`}
          />
        </div>
      </div>
    </div>
  );
};

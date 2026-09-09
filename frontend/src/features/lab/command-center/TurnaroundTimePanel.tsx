/**
 * Turnaround time — end-to-end duration and stage composition.
 */

import { Skeleton } from '@/components/loaders/Skeleton';
import { cn } from '@/utils';
import type { TurnaroundTimeResponse } from '../api/commandCenter.api';
import {
  COMMAND_CENTER_SECTION,
  DELTA_TONE_CLASS,
  DonutChart,
  DonutPanelLayout,
  LegendRow,
  Panel,
  PanelBody,
  PanelEmpty,
  PanelError,
  StatLine,
  formatHours,
} from './components';
import {
  useCommandCenterDashboardContext,
  usePanelTimeRangeHeader,
} from './useCommandCenterDashboard';

const STAGE_COLORS: Record<string, string> = {
  pending: 'fill-chart-axis',
  collected: 'fill-info-fg-emphasis',
  processing: 'fill-warning-fg-emphasis',
  validation: 'fill-success-fg-emphasis',
};

function tatDelta(data: TurnaroundTimeResponse): { label: string; tone: 'success' | 'warning' | 'danger' } {
  const delta = data.avgHours - data.targetHours;
  if (delta <= 0) return { label: `${Math.abs(delta).toFixed(1)}h under target`, tone: 'success' };
  if (delta <= 0.5) return { label: `+${delta.toFixed(1)}h over target`, tone: 'warning' };
  return { label: `+${delta.toFixed(1)}h over target`, tone: 'danger' };
}

function TurnaroundContent({ data }: { data: TurnaroundTimeResponse }) {
  const delta = tatDelta(data);
  const stageTotalHours = data.stages.reduce((sum, stage) => sum + stage.hours, 0);

  return (
    <DonutPanelLayout
      donut={
        <DonutChart
          segments={data.stages.map(stage => ({
            value: stage.hours,
            colorClass: STAGE_COLORS[stage.key] ?? 'fill-chart-axis',
          }))}
          centerLabel={formatHours(data.avgHours)}
          centerDetail="average"
        />
      }
    >
      <p className={COMMAND_CENTER_SECTION.statLabel}>Time by stage</p>
      <p className={cn('mt-0.5 text-xxs tabular-nums', DELTA_TONE_CLASS[delta.tone])}>
        {delta.label}
      </p>

      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
        <div className="space-y-1">
          {data.stages.slice(0, 2).map(stage => {
            const share =
              stageTotalHours > 0 ? Math.round((stage.hours / stageTotalHours) * 100) : 0;

            return (
              <LegendRow
                key={stage.key}
                colorClass={STAGE_COLORS[stage.key] ?? 'fill-chart-axis'}
                label={stage.label}
                value={formatHours(stage.hours)}
                detail={`${share}%`}
              />
            );
          })}
          <StatLine
            label="Target · Median"
            value={`${formatHours(data.targetHours)} · ${formatHours(data.medianHours)}`}
          />
        </div>

        <div className="space-y-1">
          {data.stages.slice(2).map(stage => {
            const share =
              stageTotalHours > 0 ? Math.round((stage.hours / stageTotalHours) * 100) : 0;

            return (
              <LegendRow
                key={stage.key}
                colorClass={STAGE_COLORS[stage.key] ?? 'fill-chart-axis'}
                label={stage.label}
                value={formatHours(stage.hours)}
                detail={`${share}%`}
              />
            );
          })}
          <StatLine
            label="Min · P95 · Max"
            value={`${formatHours(data.minHours)} · ${formatHours(data.p95Hours)} · ${formatHours(data.maxHours)}`}
          />
        </div>
      </div>
    </DonutPanelLayout>
  );
}

export function TurnaroundTimePanel() {
  const { data, isLoading, isError, refetch } = useCommandCenterDashboardContext();
  const { meta, headerActions } = usePanelTimeRangeHeader();
  const turnaround = data?.turnaroundTime;

  return (
    <Panel title="Turnaround Time" meta={meta} headerActions={headerActions}>
      <PanelBody>
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>
        ) : isError ? (
          <PanelError message="Unable to load turnaround time." onRetry={() => void refetch()} />
        ) : !turnaround || (turnaround.avgHours === 0 && turnaround.stages.every(s => s.hours === 0)) ? (
          <PanelEmpty message="No completed tests in this period." />
        ) : (
          <TurnaroundContent data={turnaround} />
        )}
      </PanelBody>
    </Panel>
  );
}

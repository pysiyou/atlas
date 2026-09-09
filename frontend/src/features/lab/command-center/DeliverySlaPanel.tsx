/**
 * Delivery SLA — on-time rate and delay severity breakdown.
 */

import { Skeleton } from '@/components/loaders/Skeleton';
import { cn } from '@/utils';
import type { SlaPerformanceResponse } from '../api/commandCenter.api';
import {
  COMMAND_CENTER_SECTION,
  ColumnHeader,
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

const SEVERITY_COLORS: Record<string, string> = {
  slight: 'fill-warning-fg',
  moderate: 'fill-warning-fg-emphasis',
  severe: 'fill-danger-fg-emphasis',
};

function SlaContent({ sla }: { sla: SlaPerformanceResponse }) {
  const onTimeGap = sla.onTimeTarget - sla.onTimeRate;
  const onTimeTone = onTimeGap <= 0 ? 'success' : onTimeGap <= 5 ? 'warning' : 'danger';

  return (
    <DonutPanelLayout
      donut={
        <DonutChart
          segments={[
            { value: sla.onTimeRate, colorClass: 'fill-success-fg-emphasis' },
            { value: sla.delayedRate, colorClass: 'fill-warning-fg-emphasis' },
          ]}
          centerLabel={`${sla.onTimeRate}%`}
          centerDetail="on time"
          centerTone="text-success-fg-emphasis"
        />
      }
    >
      <p className={COMMAND_CENTER_SECTION.statLabel}>Delivery outcome</p>
      <p className={cn('mt-0.5 text-xxs tabular-nums', DELTA_TONE_CLASS[onTimeTone])}>
        {onTimeGap > 0
          ? `${onTimeGap}pts below ${sla.onTimeTarget}% target`
          : `At ${sla.onTimeTarget}% target`}
      </p>

      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
        <ColumnHeader title="Volume" />
        <ColumnHeader title="Delay severity" />

        <LegendRow
          colorClass="fill-success-fg-emphasis"
          label="On time"
          value={sla.onTimeCount.toLocaleString()}
          detail={`${sla.onTimeRate}%`}
          valueTone="text-success-fg-emphasis"
        />
        {sla.delaySeverity[0] && (
          <LegendRow
            colorClass={SEVERITY_COLORS[sla.delaySeverity[0].key] ?? 'fill-warning-fg'}
            label={sla.delaySeverity[0].label}
            value={sla.delaySeverity[0].count.toLocaleString()}
            detail={`${sla.delaySeverity[0].pct}%`}
          />
        )}

        <LegendRow
          colorClass="fill-warning-fg-emphasis"
          label="Delayed"
          value={sla.delayedCount.toLocaleString()}
          detail={`${sla.delayedRate}%`}
          valueTone="text-warning-fg-emphasis"
        />
        {sla.delaySeverity[1] && (
          <LegendRow
            colorClass={SEVERITY_COLORS[sla.delaySeverity[1].key] ?? 'fill-warning-fg-emphasis'}
            label={sla.delaySeverity[1].label}
            value={sla.delaySeverity[1].count.toLocaleString()}
            detail={`${sla.delaySeverity[1].pct}%`}
          />
        )}

        <StatLine label="Avg over target" value={formatHours(sla.avgDelayOverTarget)} />
        {sla.delaySeverity[2] && (
          <LegendRow
            colorClass={SEVERITY_COLORS[sla.delaySeverity[2].key] ?? 'fill-danger-fg-emphasis'}
            label={sla.delaySeverity[2].label}
            value={sla.delaySeverity[2].count.toLocaleString()}
            detail={`${sla.delaySeverity[2].pct}%`}
          />
        )}

        <StatLine label="Target" value={`${sla.onTimeTarget}%`} />
        <StatLine label="Total tests" value={sla.totalTests.toLocaleString()} />
      </div>
    </DonutPanelLayout>
  );
}

export function DeliverySlaPanel() {
  const { data, isLoading, isError, refetch } = useCommandCenterDashboardContext();
  const { meta, headerActions } = usePanelTimeRangeHeader();
  const sla = data?.slaPerformance;

  return (
    <Panel title="SLA Performance" meta={meta} headerActions={headerActions}>
      <PanelBody>
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>
        ) : isError ? (
          <PanelError message="Unable to load SLA performance." onRetry={() => void refetch()} />
        ) : !sla || sla.totalTests === 0 ? (
          <PanelEmpty message="No completed tests in this period." />
        ) : (
          <SlaContent sla={sla} />
        )}
      </PanelBody>
    </Panel>
  );
}

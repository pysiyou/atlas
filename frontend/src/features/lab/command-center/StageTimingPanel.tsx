/**
 * Stage timing — turnaround hours per workflow stage.
 */

import { Skeleton } from '@/components/loaders/Skeleton';
import { cn } from '@/utils';
import type { StageTimingItem } from '../api/commandCenter.api';
import { formatHours, Panel, PanelBody, PanelEmpty, PanelError } from './components';
import {
  useCommandCenterDashboardContext,
  usePanelTimeRangeHeader,
} from './useCommandCenterDashboard';

const STAGE_COLORS: Record<string, string> = {
  pending: 'bg-chart-axis',
  collected: 'bg-info-fg-emphasis',
  processing: 'bg-warning-fg-emphasis',
  validation: 'bg-success-fg-emphasis',
};

function stageDelta(hours: number, targetHours: number): 'success' | 'warning' | 'danger' {
  const delta = hours - targetHours;
  if (delta <= 0) return 'success';
  if (delta <= 0.5) return 'warning';
  return 'danger';
}

const BAR_TONE_CLASS = {
  success: 'bg-success-fg-emphasis',
  warning: 'bg-warning-fg-emphasis',
  danger: 'bg-danger-fg-emphasis',
} as const;

function StageRow({ stage }: { stage: StageTimingItem }) {
  const tone = stageDelta(stage.hours, stage.targetHours);
  const targetPct = Math.min((stage.targetHours / stage.p95Hours) * 100, 100);
  const avgPct = Math.min((stage.hours / stage.p95Hours) * 100, 100);
  const colorClass = STAGE_COLORS[stage.key] ?? 'bg-chart-axis';

  return (
    <li>
      <div className="flex items-center justify-between gap-2 text-xxs">
        <span className="flex min-w-0 items-center gap-1.5 truncate text-text-secondary">
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-sm', colorClass)} />
          {stage.name}
        </span>
        <span className="shrink-0 tabular-nums text-text-primary">
          {formatHours(stage.hours)}
          <span className="text-text-tertiary"> / {formatHours(stage.targetHours)}</span>
        </span>
      </div>

      <div className="relative mt-1 h-1 overflow-hidden rounded-full bg-surface-hover">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-border-strong"
          style={{ width: `${stage.p95Hours > 0 ? targetPct : 0}%` }}
        />
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full', BAR_TONE_CLASS[tone])}
          style={{ width: `${stage.p95Hours > 0 ? avgPct : 0}%` }}
        />
      </div>

      <div className="mt-0.5 flex items-center justify-between text-[9px] tabular-nums text-text-tertiary">
        <span>Min {formatHours(stage.minHours)} · Max {formatHours(stage.maxHours)}</span>
        <span>P95 {formatHours(stage.p95Hours)}</span>
      </div>
    </li>
  );
}

export function StageTimingPanel() {
  const { data, isLoading, isError, refetch } = useCommandCenterDashboardContext();
  const { meta, headerActions } = usePanelTimeRangeHeader();
  const stages = data?.stageTiming.stages ?? [];

  return (
    <Panel title="Stage Timing" meta={meta} headerActions={headerActions}>
      <PanelBody>
        {isLoading ? (
          <div className="space-y-2 px-3 py-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <PanelError message="Unable to load stage timing." onRetry={() => void refetch()} />
        ) : stages.length === 0 ? (
          <PanelEmpty message="No completed tests in this period." />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-2">
            <ul className="space-y-2">
              {stages.map(stage => (
                <StageRow key={stage.key} stage={stage} />
              ))}
            </ul>
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}

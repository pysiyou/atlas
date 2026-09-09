/**
 * Delay impact — root causes ranked by time lost.
 */

import { Skeleton } from '@/components/loaders/Skeleton';
import { cn } from '@/utils';
import type { DelaySourceItem } from '../api/commandCenter.api';
import { formatHours, Panel, PanelBody, PanelEmpty, PanelError } from './components';
import {
  useCommandCenterDashboardContext,
  usePanelTimeRangeHeader,
} from './useCommandCenterDashboard';

const SOURCE_COLORS: Record<string, string> = {
  escalations: 'bg-danger-fg-emphasis',
  rework: 'bg-warning-fg-emphasis',
  sample: 'bg-info-fg-emphasis',
};

function DelaySourceRow({
  source,
  totalImpactHours,
}: {
  source: DelaySourceItem;
  totalImpactHours: number;
}) {
  const impactPct = totalImpactHours > 0 ? (source.impactHours / totalImpactHours) * 100 : 0;
  const colorClass = SOURCE_COLORS[source.key] ?? 'bg-chart-axis';

  return (
    <li>
      <div className="flex items-center justify-between gap-2 text-xxs">
        <span className="flex min-w-0 items-center gap-1.5 truncate text-text-secondary">
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-sm', colorClass)} />
          {source.name}
        </span>
        <span className="shrink-0 tabular-nums font-semibold text-text-primary">
          {formatHours(source.avgDelayHours)}
        </span>
      </div>

      <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-hover">
        <div
          className={cn('h-full rounded-full', colorClass)}
          style={{ width: `${impactPct}%` }}
        />
      </div>

      <div className="mt-0.5 flex items-center justify-between text-[9px] tabular-nums text-text-tertiary">
        <span>{source.count} incidents · {source.pctOfTests}% of tests</span>
        <span>{source.impactHours}h total</span>
      </div>
    </li>
  );
}

export function DelayImpactPanel() {
  const { data, isLoading, isError, refetch } = useCommandCenterDashboardContext();
  const { meta, headerActions } = usePanelTimeRangeHeader();
  const sources = data?.delayImpact.sources ?? [];
  const totalImpactHours = data?.delayImpact.totalImpactHours ?? 0;

  return (
    <Panel title="Delay Root Causes" meta={meta} headerActions={headerActions}>
      <PanelBody>
        {isLoading ? (
          <div className="space-y-2 px-3 py-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <PanelError message="Unable to load delay impact." onRetry={() => void refetch()} />
        ) : sources.length === 0 ? (
          <PanelEmpty message="No delay incidents in this period." />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-2">
            <ul className="space-y-2">
              {sources.map(source => (
                <DelaySourceRow
                  key={source.key}
                  source={source}
                  totalImpactHours={totalImpactHours}
                />
              ))}
            </ul>
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}

/**
 * Live test flow — timeline ledger with scoreboard.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/loaders/Skeleton';
import { ICONS } from '@/config/icons';
import { cn } from '@/utils';
import { getLabTabPath } from '../constants/labTabs';
import {
  buildTestFlowModel,
  type PipelineItem,
  type TestFlowViewModel,
} from './buildTestFlowModel';
import {
  COMMAND_CENTER_PIPELINE_BAR,
  COMMAND_CENTER_SECTION,
  ColumnHeader,
  KpiTile,
  LegendRow,
  Panel,
  PanelBody,
  PanelError,
  StatLine,
  type CommandCenterKpiTone,
} from './components';
import {
  useCommandCenterDashboardContext,
  usePanelTimeRangeHeader,
} from './useCommandCenterDashboard';

const PANEL_TITLE = 'Live Test Flow';

function stageCount(items: PipelineItem[], status: PipelineItem['status']): number {
  return items.find(item => item.status === status)?.count ?? 0;
}

function queueTone(count: number, active: number): CommandCenterKpiTone {
  if (count === 0 || active <= 0) return 'neutral';
  return count / active >= 0.5 ? 'warning' : 'brand';
}

function QueuePulse({ view }: { view: TestFlowViewModel }) {
  const active = view.activeTests;
  const pending = stageCount(view.mainFlow, 'pending');
  const collected = stageCount(view.mainFlow, 'sample-collected');
  const resulted = stageCount(view.mainFlow, 'resulted');
  const share = (count: number) => (active > 0 ? Math.round((count / active) * 100) : 0);
  const attentionTone: CommandCenterKpiTone =
    view.health === 'critical' ? 'danger' : view.health === 'attention' ? 'warning' : 'success';

  return (
    <div className="flex shrink-0 gap-2">
      <KpiTile
        icon={ICONS.dataFields.flask}
        label="Collection"
        value={pending}
        denominator={active}
        ringValue={share(pending)}
        tone={queueTone(pending, active)}
        to={getLabTabPath('collection')}
      />
      <KpiTile
        icon={ICONS.dataFields.notebook}
        label="Entry"
        value={collected}
        denominator={active}
        ringValue={share(collected)}
        tone={queueTone(collected, active)}
        to={getLabTabPath('entry')}
      />
      <KpiTile
        icon={ICONS.ui.shieldCheck}
        label="Review"
        value={resulted}
        denominator={active}
        ringValue={share(resulted)}
        tone={queueTone(resulted, active)}
        to={getLabTabPath('validation')}
      />
      <KpiTile
        icon={ICONS.actions.alertCircle}
        label="Exceptions"
        value={view.attentionCount}
        denominator={active}
        ringValue={share(view.attentionCount)}
        tone={attentionTone}
        to={view.attentionCount > 0 ? getLabTabPath('validation') : undefined}
      />
    </div>
  );
}

function TimelineRow({ item, isLast }: { item: PipelineItem; isLast?: boolean }) {
  return (
    <li className="relative pl-4">
      <span
        className={cn(
          'absolute left-0 top-1.5 h-2 w-2 -translate-x-1/2 rounded-full border-2 border-surface',
          COMMAND_CENTER_PIPELINE_BAR[item.status],
        )}
      />
      {!isLast && <span className="absolute left-0 top-3.5 h-[calc(100%-2px)] w-px -translate-x-1/2 bg-border-subtle" />}
      <div className="flex items-baseline gap-1 pb-1.5 text-xxs">
        <span className="shrink-0 text-text-secondary">{item.label}</span>
        <span className="min-w-0 flex-1 border-b border-dotted border-border-subtle" />
        <span className="shrink-0 tabular-nums font-medium text-text-primary">{item.count}</span>
        <span className="shrink-0 w-8 text-right tabular-nums text-text-tertiary">{item.percentage}%</span>
      </div>
    </li>
  );
}

function FlowTimeline({ mainFlow }: { mainFlow: PipelineItem[] }) {
  return (
    <div className="min-h-0 flex-1">
      <p className="mb-1 text-[9px] uppercase tracking-wide text-text-tertiary">Pipeline</p>
      <ul className="pl-2">
        {mainFlow.map((item, index) => (
          <TimelineRow key={item.status} item={item} isLast={index === mainFlow.length - 1} />
        ))}
      </ul>
    </div>
  );
}

const OPS_FILL = {
  default: 'fill-chart-axis',
  success: 'fill-success-fg-emphasis',
  warning: 'fill-warning-fg-emphasis',
  danger: 'fill-danger-fg-emphasis',
} as const;

const OPS_VALUE_TONE = {
  default: 'text-text-primary',
  success: 'text-success-fg-emphasis',
  warning: 'text-warning-fg-emphasis',
  danger: 'text-danger-fg-emphasis',
} as const;

function OpsLegend({
  label,
  value,
  tone = 'default',
  href,
}: {
  label: string;
  value: string | number;
  tone?: keyof typeof OPS_FILL;
  href?: string;
}) {
  const row = (
    <LegendRow
      colorClass={OPS_FILL[tone]}
      label={label}
      value={String(value)}
      valueTone={OPS_VALUE_TONE[tone]}
    />
  );

  if (!href) return row;

  return (
    <Link to={href} className="rounded hover:bg-surface-hover/60">
      {row}
    </Link>
  );
}

function Scoreboard({ view }: { view: TestFlowViewModel }) {
  const openTone = view.escalations.open > 0 ? 'danger' : 'default';
  const pipelineTone = view.escalatedInFlow > 0 ? 'danger' : 'default';
  const pendingTone = view.recollection.pending > 0 ? 'warning' : 'default';
  const qualityTone =
    view.qualityIssues > 5 ? 'danger' : view.qualityIssues > 0 ? 'warning' : 'success';

  return (
    <div className="min-h-0">
      <p className={COMMAND_CENTER_SECTION.statLabel}>Operations</p>
      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
        <ColumnHeader title="Escalations" />
        <ColumnHeader title="Recollection" />

        <OpsLegend
          tone={openTone}
          label="Open"
          value={view.escalations.open}
          href={view.escalations.open > 0 ? getLabTabPath('validation') : undefined}
        />
        <OpsLegend tone={pendingTone} label="Pending" value={view.recollection.pending} />

        <OpsLegend tone="success" label="Resolved" value={view.escalations.resolved} />
        <OpsLegend tone="success" label="Approved" value={view.recollection.approved} />

        <OpsLegend tone={pipelineTone} label="In pipeline" value={view.escalatedInFlow} />
        <OpsLegend tone="danger" label="Denied" value={view.recollection.denied} />

        <OpsLegend tone="success" label="Resolution" value={`${view.escalationResolutionRate}%`} />
        <OpsLegend tone={qualityTone} label="Quality issues" value={view.qualityIssues} />

        <StatLine label="Cancelled" value={String(view.cancelledCount)} />
        <StatLine label="Removed" value={String(view.removedCount)} />

        <StatLine label="Recollect total" value={String(view.recollectionTotal)} />
      </div>
    </div>
  );
}

function FlowLayout({ view }: { view: TestFlowViewModel }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <QueuePulse view={view} />

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-x-4">
        <FlowTimeline mainFlow={view.mainFlow} />
        <Scoreboard view={view} />
      </div>
    </div>
  );
}

function LoadingSkeleton({ meta, headerActions }: { meta: string; headerActions: React.ReactNode }) {
  return (
    <Panel title={PANEL_TITLE} meta={meta} headerActions={headerActions}>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-3 py-2">
        <div className="flex gap-2">
          <Skeleton className="h-14 flex-1" />
          <Skeleton className="h-14 flex-1" />
          <Skeleton className="h-14 flex-1" />
          <Skeleton className="h-14 flex-1" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-4">
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
        </div>
      </div>
    </Panel>
  );
}

export const TestFlowPanel: React.FC = () => {
  const { data, isLoading, isError, refetch } = useCommandCenterDashboardContext();
  const { meta, headerActions } = usePanelTimeRangeHeader();
  const view = useMemo(
    () => (data ? buildTestFlowModel(data.operationsOverview) : null),
    [data]
  );

  if (isLoading) return <LoadingSkeleton meta={meta} headerActions={headerActions} />;

  if (isError || !view) {
    return (
      <Panel title={PANEL_TITLE} meta={meta} headerActions={headerActions}>
        <PanelError message="Unable to load test flow data." onRetry={() => void refetch()} />
      </Panel>
    );
  }

  return (
    <Panel title={PANEL_TITLE} meta={meta} headerActions={headerActions}>
      <PanelBody>
        <div className="h-full min-h-0 overflow-hidden px-3 py-2">
          <FlowLayout view={view} />
        </div>
      </PanelBody>
    </Panel>
  );
};

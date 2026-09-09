/**
 * OperationsOverview — Polished lab operations dashboard (no scroll).
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/loaders/Skeleton';
import { ICONS } from '@/config/icons';
import { queryKeys } from '@/lib/query/keys';
import { cn } from '@/utils';
import {
  TEST_STATUS_CONFIG,
  type TestStatus,
} from '@/types/enums/generated/test';
import { monitoringAPI } from '../api/monitoring.api';
import {
  CommandCenterCard,
  CommandCenterExceptionTile,
  CommandCenterKpiTile,
  CommandCenterPanel,
  CommandCenterPanelError,
  CommandCenterSectionHeader,
  SegmentedBar,
} from './commandCenterShared';
import {
  COMMAND_CENTER_CARD,
  COMMAND_CENTER_PIPELINE_BAR,
  COMMAND_CENTER_PIPELINE_TEXT,
  COMMAND_CENTER_SECTION,
  type CommandCenterKpiTone,
} from './commandCenterStyles';

const HOURS_BACK = 24;

const PIPELINE_ORDER: TestStatus[] = [
  'pending',
  'sample-collected',
  'resulted',
  'validated',
  'escalated',
  'cancelled',
];

function useOperationsOverviewQuery(hours_back: number) {
  return useQuery({
    queryKey: queryKeys.monitoring.operationsOverview(hours_back),
    queryFn: async () => {
      const result = await monitoringAPI.getOperationsOverview(hours_back);
      if (!result) throw new Error('No data returned from operations overview endpoint');
      return result;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

interface PipelineItem {
  status: TestStatus;
  label: string;
  count: number;
  percentage: number;
}

interface OperationsMetrics {
  totalTests: number;
  activeTests: number;
  validatedCount: number;
  completionRate: number;
  attentionCount: number;
  pipeline: PipelineItem[];
  health: 'healthy' | 'attention' | 'critical';
  summary: string;
}

function buildMetrics(data: {
  testFlow: Record<string, number>;
  escalations: { open: number; resolved: number };
  qualityIssues: number;
  recollectionRequests: { pending: number; approved: number; denied: number };
}): OperationsMetrics {
  const { testFlow, escalations, qualityIssues, recollectionRequests } = data;

  const pipeline = PIPELINE_ORDER
    .map(status => ({
      status,
      label: TEST_STATUS_CONFIG[status].label,
      count: testFlow[status] ?? 0,
      percentage: 0,
    }))
    .filter(item => item.count > 0);

  const totalTests = pipeline.reduce((sum, item) => sum + item.count, 0);
  pipeline.forEach(item => {
    item.percentage = totalTests > 0 ? Math.round((item.count / totalTests) * 100) : 0;
  });

  const validatedCount = testFlow.validated ?? 0;
  const activeTests = totalTests - (testFlow.cancelled ?? 0) - (testFlow.removed ?? 0);
  const completionRate = activeTests > 0 ? Math.round((validatedCount / activeTests) * 100) : 0;

  const attentionCount =
    (escalations.open ?? 0) +
    (testFlow.escalated ?? 0) +
    (recollectionRequests.pending ?? 0);

  let health: OperationsMetrics['health'] = 'healthy';
  if (escalations.open > 0 || (testFlow.escalated ?? 0) > 0) {
    health = 'critical';
  } else if (attentionCount > 0 || qualityIssues > 5) {
    health = 'attention';
  }

  let summary: string;
  if (totalTests === 0) {
    summary = 'No test activity in the last 24 hours.';
  } else {
    summary = `${activeTests} active · ${completionRate}% validated`;
    if (escalations.open > 0) {
      summary += ` · ${escalations.open} escalation${escalations.open === 1 ? '' : 's'}`;
    } else if (qualityIssues > 0) {
      summary += ` · ${qualityIssues} quality issue${qualityIssues === 1 ? '' : 's'}`;
    } else if (recollectionRequests.pending > 0) {
      summary += ` · ${recollectionRequests.pending} recollection${recollectionRequests.pending === 1 ? '' : 's'}`;
    }
  }

  return {
    totalTests,
    activeTests,
    validatedCount,
    completionRate,
    attentionCount,
    pipeline,
    health,
    summary,
  };
}

function getReviewConfig(
  health: OperationsMetrics['health'],
  attentionCount: number,
  activeTests: number,
  attentionRate: number,
) {
  return {
    healthy: {
      value: 0,
      denominator: activeTests,
      tone: 'success' as CommandCenterKpiTone,
      ringValue: 100,
      icon: ICONS.status.checkCircle,
    },
    attention: {
      value: attentionCount,
      denominator: activeTests,
      tone: 'warning' as CommandCenterKpiTone,
      ringValue: attentionRate,
      icon: ICONS.actions.alertTriangle,
    },
    critical: {
      value: attentionCount,
      denominator: activeTests,
      tone: 'danger' as CommandCenterKpiTone,
      ringValue: attentionRate,
      icon: ICONS.status.alertCircle,
    },
  }[health];
}

function LoadingSkeleton() {
  return (
    <CommandCenterPanel title="Operations Overview" meta={`Last ${HOURS_BACK} hours`}>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3">
        <div className="grid shrink-0 grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded" />
          ))}
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-full rounded" />
          ))}
        </div>
      </div>
    </CommandCenterPanel>
  );
}

export const OperationsOverview: React.FC = () => {
  const { data, isLoading, isError, refetch } = useOperationsOverviewQuery(HOURS_BACK);
  const metrics = useMemo(() => (data ? buildMetrics(data) : null), [data]);

  if (isLoading) return <LoadingSkeleton />;

  if (isError || !data || !metrics) {
    return (
      <CommandCenterPanel title="Operations Overview" meta={`Last ${HOURS_BACK} hours`}>
        <CommandCenterPanelError
          message="Unable to load operations overview."
          onRetry={() => void refetch()}
        />
      </CommandCenterPanel>
    );
  }

  const { escalations, qualityIssues, recollectionRequests } = data;
  const activeRate =
    metrics.totalTests > 0 ? Math.round((metrics.activeTests / metrics.totalTests) * 100) : 0;
  const attentionRate =
    metrics.activeTests > 0
      ? Math.min(100, Math.round((metrics.attentionCount / metrics.activeTests) * 100))
      : 0;
  const reviewConfig = getReviewConfig(
    metrics.health,
    metrics.attentionCount,
    metrics.activeTests,
    attentionRate,
  );
  const attentionTone: CommandCenterKpiTone =
    metrics.attentionCount > 0
      ? escalations.open > 0 || (data.testFlow.escalated ?? 0) > 0
        ? 'danger'
        : 'warning'
      : 'neutral';

  const pipelineSegments = metrics.pipeline.map(item => ({
    key: item.status,
    percentage: item.percentage,
    colorClass: COMMAND_CENTER_PIPELINE_BAR[item.status],
    title: `${item.label} ${item.count} (${item.percentage}%)`,
  }));

  return (
    <CommandCenterPanel title="Operations Overview" meta={`Last ${HOURS_BACK} hours`}>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-3 py-2">
        <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
          <CommandCenterKpiTile
            icon={ICONS.lab.flask}
            label="Active tests"
            value={metrics.activeTests}
            denominator={metrics.totalTests}
            tone="brand"
            ringValue={activeRate}
          />
          <CommandCenterKpiTile
            icon={ICONS.status.checkCircle}
            label="Validated"
            value={metrics.validatedCount}
            denominator={metrics.activeTests}
            tone="success"
            ringValue={metrics.completionRate}
          />
          <CommandCenterKpiTile
            icon={ICONS.actions.alertTriangle}
            label="Needs attention"
            value={metrics.attentionCount}
            denominator={metrics.activeTests}
            tone={attentionTone}
            ringValue={attentionRate}
            to={metrics.attentionCount > 0 ? '/lab/escalations' : undefined}
          />
          <CommandCenterKpiTile
            icon={reviewConfig.icon}
            label="TO REVIEW"
            value={reviewConfig.value}
            denominator={reviewConfig.denominator}
            tone={reviewConfig.tone}
            ringValue={reviewConfig.ringValue}
          />
        </div>

        <p className={COMMAND_CENTER_SECTION.summary}>{metrics.summary}</p>

        <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
          <CommandCenterCard>
            <CommandCenterSectionHeader title="Test pipeline" detail={`${metrics.totalTests} total`} />
            <SegmentedBar segments={pipelineSegments} ariaLabel="Test pipeline distribution" />
            <ul className="mt-2 grid min-h-0 flex-1 content-start gap-y-1 overflow-hidden">
              {metrics.pipeline.map(item => (
                <li key={item.status} className="flex items-center justify-between gap-2 text-xxs">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className={cn('h-2 w-2 shrink-0 rounded-full', COMMAND_CENTER_PIPELINE_BAR[item.status])}
                    />
                    <span className={cn('truncate font-medium', COMMAND_CENTER_PIPELINE_TEXT[item.status])}>
                      {item.label}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-text-secondary">
                    {item.count}
                    <span className="ml-1 text-text-tertiary">({item.percentage}%)</span>
                  </span>
                </li>
              ))}
              {metrics.pipeline.length === 0 && (
                <li className="text-xxs text-text-tertiary">No pipeline data</li>
              )}
            </ul>
          </CommandCenterCard>

          <CommandCenterCard>
            <CommandCenterSectionHeader title="Exceptions" />
            <div className="grid min-h-0 flex-1 grid-cols-2 gap-1.5 content-center">
              <CommandCenterExceptionTile
                label="Open escalations"
                value={escalations.open}
                tone={escalations.open > 0 ? 'danger' : 'neutral'}
                to="/lab/escalations"
              />
              <CommandCenterExceptionTile
                label="Quality issues"
                value={qualityIssues}
                tone={qualityIssues > 5 ? 'warning' : 'neutral'}
              />
              <CommandCenterExceptionTile
                label="Pending recollections"
                value={recollectionRequests.pending}
                tone={recollectionRequests.pending > 0 ? 'warning' : 'neutral'}
                to="/lab/recollection-requests"
              />
              <CommandCenterExceptionTile
                label="Resolved"
                value={escalations.resolved}
                tone="success"
              />
            </div>
          </CommandCenterCard>

          <CommandCenterCard>
            <CommandCenterSectionHeader title="Throughput" />
            <dl className="flex min-h-0 flex-1 flex-col justify-center gap-2">
              <div className={COMMAND_CENTER_CARD.inner}>
                <dt className={COMMAND_CENTER_SECTION.statLabel}>Tests processed</dt>
                <dd className="text-2xl font-semibold tabular-nums text-text-primary">{metrics.totalTests}</dd>
              </div>
              <div className="space-y-1.5 text-xxs">
                <div className={COMMAND_CENTER_CARD.row}>
                  <span className="text-text-secondary">Recollections approved</span>
                  <span className="font-semibold tabular-nums text-success-fg-emphasis">
                    {recollectionRequests.approved}
                  </span>
                </div>
                <div className={COMMAND_CENTER_CARD.row}>
                  <span className="text-text-secondary">Recollections denied</span>
                  <span className="font-semibold tabular-nums text-text-primary">
                    {recollectionRequests.denied}
                  </span>
                </div>
                <div className={COMMAND_CENTER_CARD.rowLast}>
                  <span className="text-text-secondary">Escalations cleared</span>
                  <span className="font-semibold tabular-nums text-text-primary">{escalations.resolved}</span>
                </div>
              </div>
            </dl>
          </CommandCenterCard>
        </div>
      </div>
    </CommandCenterPanel>
  );
};

/**
 * CommandCenterDashboard - Lab command center: header, overview, pipeline, key queues, table, chart.
 * Grid layout aligned with procurement-dashboard reference. Refresh, navigation, escalation handlers preserved.
 */

import React, { useCallback, useMemo } from 'react';
import { Button, IconButton, Icon } from '@/shared/ui';
import { ICONS } from '@/utils';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { usePendingEscalation, useInvalidateOrders } from '@/hooks/queries';
import { useCommandCenterData } from './hooks';
import {
  OverviewCard,
  SmallKpiCard,
  WorkflowPipelineVisual,
  KeyQueuesCard,
  WorkflowTableCard,
  CommandCenterChartCard,
} from './components';
import type { LabTabId } from './components/WorkflowPipelineVisual';
import type { PendingEscalationItem } from '@/types/lab-operations';
import type { TestWithContext } from '@/types';

export interface CommandCenterDashboardProps {
  onNavigateToTab?: (tab: LabTabId) => void;
}

function formatLastUpdated(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const CommandCenterDashboard: React.FC<CommandCenterDashboardProps> = ({
  onNavigateToTab,
}) => {
  const data = useCommandCenterData();
  const { notifyDoctor, isNotifying } = data;
  const { invalidatePendingEscalation } = usePendingEscalation();
  const { invalidateAll: invalidateOrders } = useInvalidateOrders();
  const { openModal } = useModal();

  const handleEscalatedClick = useCallback(
    (item: PendingEscalationItem) => {
      openModal(ModalType.ESCALATION_RESOLUTION_DETAIL, {
        test: item as unknown as TestWithContext,
        onResolved: async () => {
          invalidatePendingEscalation();
          await invalidateOrders();
          await data.refetch();
        },
      });
    },
    [openModal, invalidatePendingEscalation, invalidateOrders, data.refetch]
  );

  const sparklinePre = useMemo(() => {
    const p = data.workflow.preAnalytical.pending;
    return [{ name: '1', value: p }, { name: '2', value: Math.max(0, p - 1) }, { name: '3', value: p }];
  }, [data.workflow.preAnalytical.pending]);
  const sparklineAna = useMemo(() => {
    const a = data.workflow.analytical.pending;
    return [{ name: '1', value: a }, { name: '2', value: Math.max(0, a - 1) }, { name: '3', value: a }];
  }, [data.workflow.analytical.pending]);

  if (
    data.isLoading &&
    data.criticalAlerts.length === 0 &&
    data.workflow.preAnalytical.pending === 0
  ) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-pulse text-text-tertiary text-sm">
          Loading command center…
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0 w-full h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-3 flex-wrap p-3 pb-2 min-w-0">
        <h1 className="text-lg font-bold text-text-primary truncate min-w-0">Lab Command Center</h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-text-tertiary whitespace-nowrap">
            Last updated {formatLastUpdated(data.lastUpdated)}
          </span>
          <Button variant="refresh" size="sm" onClick={() => data.refetch()}>
            Refresh
          </Button>
          <IconButton variant="download" size="sm" aria-label="Export" />
          <IconButton
            variant="secondary"
            size="sm"
            icon={<Icon name={ICONS.ui.link} className="w-4 h-4" />}
            aria-label="Share"
          />
        </div>
      </div>

      {/* Content: two equal rows filling remaining height */}
      <div className="flex-1 grid grid-rows-2 min-h-0 gap-2 px-3 pb-3">
        {/* Upper row: left | center | right */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] gap-2 min-h-0 min-w-0">
          <div className="flex flex-col gap-2 min-w-0 min-h-0 overflow-auto">
            <OverviewCard
              workflow={data.workflow}
              criticalAlertsCount={data.criticalAlerts.length}
              statUrgentCount={data.statUrgentOrders}
            />
            <SmallKpiCard
              title="Pending Collections"
              count={data.workflow.preAnalytical.pending}
              sparklineData={sparklinePre}
              onExpand={onNavigateToTab ? () => onNavigateToTab('collection') : undefined}
            />
            <SmallKpiCard
              title="Pending Results"
              count={data.workflow.analytical.pending}
              sparklineData={sparklineAna}
              onExpand={onNavigateToTab ? () => onNavigateToTab('entry') : undefined}
            />
          </div>
          <div className="min-w-0 min-h-0 overflow-hidden">
            <WorkflowPipelineVisual
              workflow={data.workflow}
              onNavigateToTab={onNavigateToTab}
            />
          </div>
          <div className="min-w-0 min-h-0 overflow-auto">
            <KeyQueuesCard
              workflow={data.workflow}
              criticalAlerts={data.criticalAlerts}
              onNotifyDoctor={notifyDoctor}
              isNotifying={isNotifying}
            />
          </div>
        </div>

        {/* Lower row: table | chart */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 min-h-0 min-w-0">
          <div className="min-w-0 min-h-0 flex flex-col">
            <WorkflowTableCard
              workflow={data.workflow}
              escalatedCases={data.escalatedCases}
              onEscalatedCaseClick={handleEscalatedClick}
            />
          </div>
          <div className="min-w-0 min-h-0 flex flex-col">
            <CommandCenterChartCard />
          </div>
        </div>
      </div>
    </div>
  );
};

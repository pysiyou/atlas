/**
 * CommandCenterDashboard - Operational hub: Red Zone, Workflow Funnel, Problem Solver.
 * Replaces Analytics Dashboard tab. Refresh header, tab navigation via onNavigateToTab.
 */

import React, { useCallback } from 'react';
import { Button } from '@/shared/ui';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { usePendingEscalation, useInvalidateOrders } from '@/hooks/queries';
import { useCommandCenterData } from './hooks';
import {
  RedZoneSection,
  WorkflowFunnel,
  ProblemSolverSection,
} from './components';
import type { LabTabId } from './components/WorkflowFunnel';
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

  if (data.isLoading && data.criticalAlerts.length === 0 && data.workflow.preAnalytical.pending === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-pulse text-text-tertiary text-sm">Loading command center…</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
      {/* Refresh header */}
      <div className="flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          <span>Last updated {formatLastUpdated(data.lastUpdated)}</span>
        </div>
        <Button variant="refresh" size="sm" onClick={() => data.refetch()}>
          Refresh
        </Button>
      </div>

      {/* Red Zone */}
      <RedZoneSection
        criticalAlerts={data.criticalAlerts}
        statUrgentCount={data.statUrgentOrders}
        onNotifyDoctor={notifyDoctor}
        isNotifying={isNotifying}
      />

      {/* Workflow Funnel */}
      <WorkflowFunnel workflow={data.workflow} onNavigateToTab={onNavigateToTab} />

      {/* Problem Solver */}
      <ProblemSolverSection
        escalatedCases={data.escalatedCases}
        onEscalatedCaseClick={handleEscalatedClick}
        onSupervisorResolve={handleEscalatedClick}
      />
    </div>
  );
}

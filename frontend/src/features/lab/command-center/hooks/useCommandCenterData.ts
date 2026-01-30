/**
 * useCommandCenterData - Aggregates critical alerts, workflow counts, escalation.
 * Single hook for CommandCenterDashboard with refetch and lastUpdated.
 */

import { useMemo } from 'react';
import { usePendingEscalation } from '@/hooks/queries';
import { useCriticalAlerts } from './useCriticalAlerts';
import { useWorkflowCounts } from './useWorkflowCounts';
import type { CommandCenterDataWithActions } from '../types';

const CRITICAL_POLL_MS = 30_000;

export function useCommandCenterData() {
  const {
    alerts: criticalAlerts,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
    notifyDoctor,
    isNotifying,
  } = useCriticalAlerts({ pollingIntervalMs: CRITICAL_POLL_MS });
  const { workflow, statUrgentOrders, isLoading: workflowLoading } = useWorkflowCounts();
  const { escalatedTests: escalatedCases, isLoading: escalationLoading, refetch: refetchEscalation } = usePendingEscalation();

  const lastUpdated = useMemo(
    () => new Date(),
    [criticalAlerts.length, workflow.preAnalytical.pending, workflow.analytical.pending, workflow.postAnalytical.pending, escalatedCases.length]
  );

  const isLoading = alertsLoading || workflowLoading || escalationLoading;

  const refetch = async () => {
    await Promise.all([refetchAlerts(), refetchEscalation()]);
  };

  const data = useMemo(
    () => ({
      criticalAlerts,
      statUrgentOrders,
      workflow,
      escalatedCases,
      lastUpdated,
      isLoading,
      refetch,
      notifyDoctor,
      isNotifying,
    }),
    [criticalAlerts, statUrgentOrders, workflow, escalatedCases, lastUpdated, isLoading, notifyDoctor, isNotifying]
  );

  return data as CommandCenterDataWithActions;
}

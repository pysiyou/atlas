/**
 * Command Center data hooks: overview metrics, test rows, and activity logs.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/store';
import { useOrdersList } from '@/features/orders';
import { useTestCatalog } from '@/features/catalog';
import { useLabPipelineCounts, useLabTestsFromOrders } from '@/features/lab/hooks';
import { usePendingEscalation } from '@/features/lab/api/results.api';
import { usePendingRecollectionRequests } from '@/features/lab/api/recollection-requests.api';
import { usePendingCriticalValues } from '@/features/lab/critical-values/useCriticalValues';
import { createLabItemFilter } from '@/features/lab/components/LabWorkflowView';
import { compareQueuePriority } from '@/features/lab/utils/compareQueuePriority';
import { isActiveTest } from '@/features/orders/utils';
import { auditAPI, type GetLogsParams } from '../api/audit.api';
import {
  deriveQueueSince,
  deriveWaitMs,
  getStageLabel,
  isStaleWait,
  useDistributionByStage,
} from './pipeline';
import type { TestStatus, TestWithContext } from '@/types';
import type { LabOperationRecord } from '@/types/lab-operations';

const ACTIVE_STATUSES: TestStatus[] = ['pending', 'sample-collected', 'resulted', 'escalated'];
const MAX_ACCUMULATED_LOGS = 200;

function isTodayLocal(isoString: string | undefined): boolean {
  if (!isoString) return false;
  const d = new Date(isoString);
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

export interface CommandCenterOverview {
  counts: ReturnType<typeof useLabPipelineCounts>['counts'];
  distribution: ReturnType<typeof useDistributionByStage>['data'];
  activeTotal: number;
  validatedToday: number;
  urgentHighCount: number;
  staleCount: number;
  arrivedToday: number;
  criticalCount: number;
  escalationCount: number;
  recollectionCount: number;
  canResolveEscalation: boolean;
  isLoading: boolean;
}

export function useCommandCenterOverview(): CommandCenterOverview {
  const { hasRole } = useAuthStore();
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);
  const { counts } = useLabPipelineCounts();
  const { data: distribution, isLoading: distributionLoading } = useDistributionByStage();
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { tests: testCatalog } = useTestCatalog();
  const { criticalValues, isLoading: criticalLoading } = usePendingCriticalValues();
  const { escalatedTests, isLoading: escalationLoading } = usePendingEscalation();
  const { requests: recollectionRequests, isLoading: recollectionLoading } =
    usePendingRecollectionRequests();

  const activeTests = useLabTestsFromOrders({
    orders,
    testCatalog,
    statusFilter: ACTIVE_STATUSES,
  });

  const metrics = useMemo(() => {
    let validatedToday = 0;
    let urgentHighCount = 0;
    let staleCount = 0;

    (orders ?? []).forEach(order => {
      (order.tests ?? []).forEach(test => {
        if (isTodayLocal(test.resultValidatedAt)) validatedToday++;
        if (
          isActiveTest(test) &&
          test.status !== 'validated' &&
          (order.priority === 'urgent' || order.priority === 'high')
        ) {
          urgentHighCount++;
        }
      });
    });

    activeTests.forEach(test => {
      const stage = getStageLabel(test.status);
      const queueSince = deriveQueueSince({
        status: test.status,
        createdAt: test.createdAt as string | undefined,
        updatedAt: test.updatedAt as string | undefined,
        collectedAt: test.collectedAt,
        resultEnteredAt: test.resultEnteredAt,
      });
      if (isStaleWait(stage, deriveWaitMs(queueSince))) staleCount++;
    });

    const activeTotal = distribution.reduce((sum, s) => sum + s.value, 0);
    const arrivedToday = distribution.reduce((sum, s) => sum + s.arrivedToday, 0);
    const criticalCount = criticalValues?.length ?? 0;
    const escalationCount = canResolveEscalation ? escalatedTests?.length ?? 0 : 0;
    const recollectionCount = canResolveEscalation ? recollectionRequests?.length ?? 0 : 0;

    return {
      activeTotal,
      validatedToday,
      urgentHighCount,
      staleCount,
      arrivedToday,
      criticalCount,
      escalationCount,
      recollectionCount,
    };
  }, [
    orders,
    distribution,
    activeTests,
    criticalValues,
    escalatedTests,
    recollectionRequests,
    canResolveEscalation,
  ]);

  return {
    counts,
    distribution,
    ...metrics,
    canResolveEscalation,
    isLoading:
      distributionLoading ||
      ordersLoading ||
      criticalLoading ||
      escalationLoading ||
      recollectionLoading,
  };
}

export interface CommandCenterTestRow extends TestWithContext {
  queueSince?: string;
  waitMs?: number;
}

export function useCommandCenterTests() {
  const { orders, isLoading } = useOrdersList();
  const { tests: testCatalog } = useTestCatalog();
  const [searchQuery, setSearchQuery] = useState('');

  const filterTest = useMemo(
    () => createLabItemFilter<TestWithContext>(item => [item.testCode]),
    []
  );

  const allTests = useLabTestsFromOrders({
    orders,
    testCatalog,
    statusFilter: ACTIVE_STATUSES,
    includeHasCriticalValues: true,
  });

  const rows = useMemo(() => {
    let result = allTests
      .map(test => {
        const queueSince = deriveQueueSince({
          status: test.status,
          createdAt: test.createdAt as string | undefined,
          updatedAt: test.updatedAt as string | undefined,
          collectedAt: test.collectedAt,
          resultEnteredAt: test.resultEnteredAt,
        });
        return { ...test, queueSince, waitMs: deriveWaitMs(queueSince) };
      })
      .sort((a, b) => compareQueuePriority(a.priority, b.priority, a.queueSince, b.queueSince));

    if (searchQuery.trim()) {
      result = result.filter(row => filterTest(row, searchQuery));
    }
    return result;
  }, [allTests, searchQuery, filterTest]);

  return { rows, searchQuery, setSearchQuery, isLoading };
}

export interface UseCommandCenterLogsOptions extends GetLogsParams {
  enabled?: boolean;
}

export function useCommandCenterLogs(options: UseCommandCenterLogsOptions = {}) {
  const { enabled = true, limit = 50, ...restParams } = options;
  const params = { ...restParams, limit };

  const [offset, setOffset] = useState(0);
  const [accumulatedLogs, setAccumulatedLogs] = useState<LabOperationRecord[]>([]);

  const countParams = {
    hoursBack: params.hoursBack,
    operationType: params.operationType,
    entityType: params.entityType,
  };

  const countQuery = useQuery({
    queryKey: ['labOperationLogsCount', countParams],
    queryFn: () => auditAPI.getCount(countParams),
    enabled,
    staleTime: 60_000,
  });

  const logsQuery = useQuery({
    queryKey: ['labOperationLogs', { ...params, offset }],
    queryFn: () => auditAPI.getLogs({ ...params, offset }),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchInterval: offset === 0 ? 60_000 : false,
  });

  const total = countQuery.data;

  useEffect(() => {
    if (!logsQuery.isSuccess || logsQuery.data == null) return;
    const page = logsQuery.data;
    const apply = () => {
      if (offset === 0) setAccumulatedLogs(page);
      else setAccumulatedLogs(prev => [...prev, ...page]);
    };
    queueMicrotask(apply);
  }, [offset, logsQuery.isSuccess, logsQuery.dataUpdatedAt, logsQuery.data]);

  const refetchLogs = useCallback(() => {
    setOffset(0);
    setAccumulatedLogs([]);
    countQuery.refetch();
    logsQuery.refetch();
  }, [countQuery, logsQuery]);

  const loadMore = useCallback(() => {
    setOffset(prev => prev + limit);
  }, [limit]);

  const hasMore =
    total !== undefined &&
    accumulatedLogs.length < total &&
    accumulatedLogs.length < MAX_ACCUMULATED_LOGS;

  return {
    logs: accumulatedLogs,
    isLoading: logsQuery.isLoading && offset === 0,
    isLoadingMore: offset > 0 && logsQuery.isFetching,
    isError: logsQuery.isError,
    error: logsQuery.error ?? null,
    refetchLogs,
    loadMore,
    hasMore,
  };
}

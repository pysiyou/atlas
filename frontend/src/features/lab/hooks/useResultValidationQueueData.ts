/**
 * useResultValidationQueueData — shared catalog, orders, and validation queue data
 * for ResultEntryQueue and ResultValidationQueue. Collection/Entry queues use their own
 * worklist hooks; Command Center counts come from GET /lab/board.
 */

import { useAuthStore } from '@/app/authStore';
import { LAB_CONFIG } from '@/features/lab/constants';
import { useOrdersList } from '@/features/orders';
import { useTestCatalog } from '@/features/catalog';
import { usePendingEscalation } from '../api/results';
import { usePendingRecollectionRequests } from '../api/recollectionRequests';
import { useOrderTestsWithLabContext } from './useOrderTestsWithLabContext';
import type { Order, Test, TestWithContext } from '@/types';
import type { TestWithContextResult } from './useOrderTestsWithLabContext';
import type { RecollectionRequestSummary } from '@/types/lab-operations';

export interface ResultValidationQueueData {
  orders: Order[];
  tests: Test[];
  validationTests: TestWithContextResult[];
  escalations: TestWithContext[];
  recollections: RecollectionRequestSummary[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  canResolveEscalation: boolean;
}

export function useResultValidationQueueData(): ResultValidationQueueData {
  const { hasRole } = useAuthStore();
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);
  const tabRefresh = { refetchInterval: LAB_CONFIG.TAB_COUNT_REFRESH_MS };

  const {
    orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErr,
    refetch: refetchOrders,
  } = useOrdersList(undefined, tabRefresh);
  const {
    tests = [],
    isLoading: catalogLoading,
    isError: catalogError,
    error: catalogErr,
    refetch: refetchCatalog,
  } = useTestCatalog();
  const { escalatedTests = [] } = usePendingEscalation(tabRefresh);
  const { requests: recollectionRequests = [] } = usePendingRecollectionRequests(tabRefresh);

  const validationTests = useOrderTestsWithLabContext({
    orders,
    testCatalog: tests,
    statusFilter: ['resulted'],
    onlyUnvalidated: true,
    includeHasCriticalValues: true,
    includePatient: true,
  });

  const isLoading = ordersLoading || catalogLoading;
  const isError = ordersError || catalogError;
  const error = ordersErr ?? catalogErr ?? null;
  const refetch = () => {
    void refetchOrders();
    void refetchCatalog();
  };

  return {
    orders,
    tests,
    validationTests,
    escalations: escalatedTests,
    recollections: recollectionRequests,
    isLoading,
    isError,
    error,
    refetch,
    canResolveEscalation,
  };
}

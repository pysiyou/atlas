/**
 * Report listing API — validated tests from server projection.
 */
import { apiClient } from '@/lib/api/client';
import { WORKFLOW_QUERY_LIMIT } from '@/lib/api/constants';
import type { Order, OrderTest } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/authStore';
import { queryKeys, cacheConfig } from '@/lib/query';
import type { ValidatedTest } from '../types';
import { calculateAge } from '@/utils';

export interface ValidatedTestReportItem {
  testId: number;
  testCode: string;
  testName: string;
  orderId: number;
  orderDate: string;
  patientId: number;
  patientName: string;
  patientDob?: string | null;
  patientGender?: string | null;
  test: OrderTest;
  order: Order;
}

function toValidatedTest(item: ValidatedTestReportItem): ValidatedTest {
  const age = item.patientDob ? calculateAge(item.patientDob) : undefined;
  return {
    testId: item.testId,
    testCode: item.testCode,
    testName: item.testName,
    orderId: item.orderId,
    orderDate: item.orderDate,
    patientId: item.patientId,
    patientName: item.patientName,
    patientAge: age,
    patientGender: item.patientGender ?? undefined,
    test: item.test,
    order: item.order,
  };
}

export const reportsAPI = {
  getValidatedTests(limit = WORKFLOW_QUERY_LIMIT): Promise<ValidatedTestReportItem[]> {
    return apiClient.get<ValidatedTestReportItem[]>('/reports/validated-tests', {
      limit: String(limit),
    });
  },
};

export function useValidatedTestsReport() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const query = useQuery({
    queryKey: queryKeys.reports.validatedTests(),
    queryFn: () => reportsAPI.getValidatedTests(),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
    select: (items: ValidatedTestReportItem[]) => items.map(toValidatedTest),
  });

  return {
    validatedTests: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

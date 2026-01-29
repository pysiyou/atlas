/**
 * useLabTestsFromOrders - Build TestWithContext[] from orders + testCatalog
 * Shared by Entry and Validation views; encapsulates test filtering and enrichment.
 */

import { useMemo } from 'react';
import {
  useTestNameLookup,
  useSampleLookup,
  usePatientNameLookup,
} from '@/hooks/queries';
import { getTestSampleType } from '@/utils/typeHelpers';
import type { Order, OrderTest, TestStatus, TestWithContext } from '@/types';
import type { Test } from '@/types';
import { isCollectedSample } from '@/types';

export interface UseLabTestsFromOrdersOptions {
  orders: Order[] | undefined;
  testCatalog: Test[] | undefined;
  /** Include tests with any of these statuses */
  statusFilter: TestStatus[];
  /** When true, exclude tests that have validatedBy set (validation view) */
  onlyUnvalidated?: boolean;
  /** Add hasCriticalValues from flags (validation view) */
  includeHasCriticalValues?: boolean;
  /** Include full patient object (entry view for demographics) */
  includePatient?: boolean;
}

export type TestWithContextResult = TestWithContext & { hasCriticalValues?: boolean };

export function useLabTestsFromOrders({
  orders,
  testCatalog,
  statusFilter,
  onlyUnvalidated = false,
  includeHasCriticalValues = false,
  includePatient = false,
}: UseLabTestsFromOrdersOptions): TestWithContextResult[] {
  const { getTest } = useTestNameLookup();
  const { getSample } = useSampleLookup();
  const { getPatient, getPatientName } = usePatientNameLookup();

  const statusSet = useMemo(() => new Set(statusFilter), [statusFilter]);

  return useMemo(() => {
    if (!orders || !testCatalog) return [];

    const testFilter = (test: OrderTest) => {
      if (!statusSet.has(test.status as TestStatus)) return false;
      if (onlyUnvalidated && test.validatedBy) return false;
      return true;
    };

    return orders.flatMap(order => {
      const patient = includePatient ? getPatient(order.patientId) : undefined;
      const patientName = getPatientName(order.patientId);

      return (order.tests ?? [])
        .filter(testFilter)
        .map(test => {
          const testName = getTest(test.testCode)?.name || test.testCode;
          const sampleType = getTestSampleType(test.testCode, testCatalog);
          const sample = test.sampleId ? getSample(test.sampleId) : undefined;
          const collected = sample && isCollectedSample(sample);
          const collectedAt = collected ? sample.collectedAt : undefined;
          const collectedBy = collected ? sample.collectedBy : undefined;

          const hasCriticalValues = includeHasCriticalValues
            ? (test.flags?.some(
                (f: string) => f.includes('critical') || f.includes('CRITICAL')
              ) || (test as OrderTest & { hasCriticalValues?: boolean }).hasCriticalValues)
            : undefined;

          const base: TestWithContext & { hasCriticalValues?: boolean; patientDob?: string } = {
            ...test,
            orderId: order.orderId,
            orderDate: order.orderDate,
            patientId: order.patientId,
            patientName,
            testName,
            sampleType,
            priority: order.priority,
            referringPhysician: order.referringPhysician,
            collectedAt,
            collectedBy,
            resultEnteredAt: test.resultEnteredAt ?? undefined,
            resultValidatedAt: test.resultValidatedAt ?? undefined,
            results: test.results ?? undefined,
            isRetest: test.isRetest,
            retestOfTestId: test.retestOfTestId,
            retestNumber: test.retestNumber,
            resultRejectionHistory: test.resultRejectionHistory,
            sampleIsRecollection: sample?.isRecollection,
            sampleOriginalSampleId: sample?.originalSampleId,
            sampleRecollectionReason: sample?.recollectionReason,
            sampleRecollectionAttempt: sample?.recollectionAttempt,
            sampleRejectionHistory: sample?.rejectionHistory,
          };

          if (includePatient && patient) {
            base.patient = patient;
          }
          if (includeHasCriticalValues && hasCriticalValues !== undefined) {
            base.hasCriticalValues = hasCriticalValues;
          }
          if (includePatient && patient?.dateOfBirth) {
            base.patientDob = patient.dateOfBirth;
          }

          return base as TestWithContextResult;
        });
    });
  }, [
    orders,
    testCatalog,
    statusSet,
    onlyUnvalidated,
    includeHasCriticalValues,
    includePatient,
    getTest,
    getPatientName,
    getPatient,
    getSample,
  ]);
}

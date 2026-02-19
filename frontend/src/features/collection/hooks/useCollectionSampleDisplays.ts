/**
 * useCollectionSampleDisplays — builds sample display list and filter/getters for CollectionView.
 */

import { useMemo, useCallback } from 'react';
import { calculateRequiredSamples } from '@/features/lab/utils';
import { isActiveTest } from '@/features/orders/utils';
import { createSampleSearchFilter } from '@/features/lab/utils/lab-helpers';
import type { SampleDisplay } from '@/features/lab/types';
import type { Order, Patient, Sample, Test } from '@/types';

export interface UseCollectionSampleDisplaysParams {
  samples: Sample[];
  tests: Test[];
  getOrder: (orderId: number) => Order | undefined;
  getPatient: (patientId: number) => Patient | undefined;
  getPatientName: (patientId: number) => string;
}

export function useCollectionSampleDisplays({
  samples,
  tests,
  getOrder,
  getPatient,
  getPatientName,
}: UseCollectionSampleDisplaysParams) {
  const displays = useMemo(() => {
    const result: SampleDisplay[] = [];
    samples.forEach(sample => {
      const order = getOrder(sample.orderId);
      if (!order) return;
      const patient = getPatient(order.patientId);
      if (!patient) return;
      const testsForSample = order.tests.filter(
        t => sample.testCodes.includes(t.testCode) && isActiveTest(t)
      );
      if (testsForSample.length > 0) {
        const requirements = calculateRequiredSamples(
          testsForSample,
          tests,
          order.priority,
          order.orderId
        );
        if (requirements.length > 0) {
          result.push({
            sample,
            order,
            patient,
            priority: sample.priority,
            requirement: requirements[0],
          });
        }
      }
    });
    return result;
  }, [samples, tests, getOrder, getPatient]);

  const filterSample = useMemo(
    () => createSampleSearchFilter(getPatientName, tests),
    [getPatientName, tests]
  );

  const getOrderDate = useCallback((d: SampleDisplay) => d.order.orderDate, []);
  const getSampleType = useCallback(
    (d: SampleDisplay) => d.requirement?.sampleType ?? d.sample?.sampleType,
    []
  );
  const getStatus = useCallback((d: SampleDisplay) => d.sample?.status, []);

  return { displays, filterSample, getOrderDate, getSampleType, getStatus };
}

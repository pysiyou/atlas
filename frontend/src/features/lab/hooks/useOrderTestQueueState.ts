/**
 * useOrderTestQueueState — React hook wrapping deriveOrderTestQueueState with order/sample context.
 */

import { useMemo } from 'react';
import { useOrderLookup } from '@/features/orders';
import { useSampleLookup } from '../api/samples';
import {
  deriveOrderTestQueueState,
  type OrderTestQueueState,
} from '../utils/labQueue';
import type { SampleStatus, TestStatus, TestWithContext } from '@/types';

export function useOrderTestQueueState(test: TestWithContext): OrderTestQueueState {
  const { getOrder } = useOrderLookup();
  const { getSample } = useSampleLookup();
  const order = getOrder(test.orderId);
  const linkedSample = test.sampleId ? getSample(test.sampleId) : undefined;
  const sampleStatus = (linkedSample?.status ?? test.sampleStatus) as SampleStatus | undefined;

  return useMemo(
    () =>
      deriveOrderTestQueueState(
        { status: test.status as TestStatus, isRetest: test.isRetest },
        {
          paymentStatus: order?.paymentStatus,
          sampleStatus,
          sampleIsRecollection: test.sampleIsRecollection,
          escalationReasonCode: test.reasonCode,
        }
      ),
    [
      test.status,
      test.isRetest,
      sampleStatus,
      test.sampleIsRecollection,
      test.reasonCode,
      order?.paymentStatus,
    ]
  );
}

/**
 * useOrderTestQueueState — React hook wrapping deriveOrderTestQueueState with order/sample context.
 */

import { useMemo } from 'react';
import { useOrderLookup } from '@/features/orders';
import {
  deriveOrderTestQueueState,
  type OrderTestQueueState,
} from '../utils/deriveOrderTestQueueState';
import type { SampleStatus, TestStatus, TestWithContext } from '@/types';

export function useOrderTestQueueState(test: TestWithContext): OrderTestQueueState {
  const { getOrder } = useOrderLookup();
  const order = getOrder(test.orderId);

  return useMemo(
    () =>
      deriveOrderTestQueueState(
        { status: test.status as TestStatus, isRetest: test.isRetest },
        {
          paymentStatus: order?.paymentStatus,
          sampleStatus: test.sampleStatus as SampleStatus | undefined,
          sampleIsRecollection: test.sampleIsRecollection,
          escalationReasonCode: test.reasonCode,
        }
      ),
    [
      test.status,
      test.isRetest,
      test.sampleStatus,
      test.sampleIsRecollection,
      test.reasonCode,
      order?.paymentStatus,
    ]
  );
}

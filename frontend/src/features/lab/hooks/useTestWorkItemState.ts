/**
 * useTestWorkItemState — React hook wrapping deriveWorkItemState with order/sample context.
 */

import { useMemo } from 'react';
import { useOrderLookup } from '@/features/orders';
import {
  deriveWorkItemState,
  type WorkItemState,
} from '@/features/lab/utils/deriveWorkItemState';
import type { SampleStatus, TestStatus, TestWithContext } from '@/types';

export function useTestWorkItemState(test: TestWithContext): WorkItemState {
  const { getOrder } = useOrderLookup();
  const order = getOrder(test.orderId);

  return useMemo(
    () =>
      deriveWorkItemState(
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

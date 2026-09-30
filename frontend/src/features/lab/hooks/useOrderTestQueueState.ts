/**
 * useOrderTestQueueState — React hook wrapping deriveOrderTestQueueState with server lab projection.
 */

import { useMemo } from 'react';
import {
  deriveOrderTestQueueState,
  type LabWorkItemProjectionLike,
  type OrderTestQueueState,
} from '../utils/labQueue';
import type { TestStatus, TestWithContext } from '@/types';

export function useOrderTestQueueState(test: TestWithContext): OrderTestQueueState {
  const lab = test.lab as LabWorkItemProjectionLike | undefined;

  return useMemo(
    () =>
      deriveOrderTestQueueState(
        { status: test.status as TestStatus, isRetest: test.isRetest },
        {
          serverDenyReason: test.denyReason ?? lab?.denyReason ?? undefined,
          serverDenyMessage: test.denyMessage ?? lab?.denyMessage ?? undefined,
          serverBlockedReason: lab?.blockedReason ?? undefined,
          lab,
        }
      ),
    [test.status, test.isRetest, test.denyReason, test.denyMessage, lab]
  );
}

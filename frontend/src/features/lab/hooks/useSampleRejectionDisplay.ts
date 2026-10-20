/**
 * Whether to show rejected-sample banner for a resulted validation work item.
 * Uses fields already on TestWithContext instead of fetching the full samples list.
 */

import { useMemo } from 'react';
import type { TestWithContext } from '@/types';

export function useSampleRejectionDisplay(test: TestWithContext) {
  return useMemo(() => {
    if (!test.sampleId || test.status !== 'resulted') {
      return { showBanner: false, sampleId: test.sampleId, sampleRejectionReason: undefined };
    }

    const isRejected = test.sampleStatus === 'rejected';
    if (!isRejected) {
      return { showBanner: false, sampleId: test.sampleId, sampleRejectionReason: undefined };
    }

    return {
      showBanner: true,
      sampleId: test.sampleId,
      sampleRejectionReason: test.sampleRecollectionReason,
    };
  }, [test.sampleId, test.sampleStatus, test.sampleRecollectionReason, test.status]);
}

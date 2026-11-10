/**
 * Whether to show rejected-sample banner for a resulted validation work item.
 */

import { useMemo } from 'react';
import type { LabOrderTestQueueRow } from '../types/labQueueChrome';

export function useSampleRejectionDisplay(row: LabOrderTestQueueRow) {
  return useMemo(() => {
    const sampleId = row.sampleId ?? undefined;
    if (!sampleId || row.status !== 'resulted') {
      return { showBanner: false, sampleId, sampleRejectionReason: undefined };
    }

    const isRejected = row.sampleStatus === 'rejected';
    if (!isRejected) {
      return { showBanner: false, sampleId, sampleRejectionReason: undefined };
    }

    return {
      showBanner: true,
      sampleId,
      sampleRejectionReason: row.sampleRecollectionReason ?? undefined,
    };
  }, [row.sampleId, row.sampleStatus, row.sampleRecollectionReason, row.status]);
}

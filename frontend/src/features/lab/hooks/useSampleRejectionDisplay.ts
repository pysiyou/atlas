/**
 * Whether to show rejected-sample banner for a resulted validation work item.
 */

import { useMemo } from 'react';
import type { LabOrderTestQueueRow } from '../types/labQueueChrome';

export function useSampleRejectionDisplay(row: LabOrderTestQueueRow) {
  return useMemo(() => {
    const sampleId = row.sampleId ?? undefined;
    const successorSampleId = row.sampleRecollectionSampleId ?? undefined;
    if (!sampleId || row.sampleStatus !== 'rejected') {
      return {
        showBanner: false,
        sampleId,
        sampleRejectionReason: undefined,
        successorSampleId,
      };
    }

    return {
      showBanner: true,
      sampleId,
      sampleRejectionReason: row.sampleRecollectionReason ?? undefined,
      successorSampleId,
    };
  }, [
    row.sampleId,
    row.sampleStatus,
    row.sampleRecollectionReason,
    row.sampleRecollectionSampleId,
  ]);
}

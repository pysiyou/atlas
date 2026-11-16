/**
 * Whether to show rejected-sample banner for a resulted validation work item.
 */

import { useMemo } from 'react';
import type { LabOrderTestQueueRow } from '../types/labQueueChrome';

export function useSampleRejectionDisplay(row: LabOrderTestQueueRow) {
  return useMemo(() => {
    const sampleId = row.sampleId ?? undefined;
    const accessionNumber = row.accessionNumber ?? undefined;
    if (!sampleId || row.status !== 'resulted') {
      return { showBanner: false, sampleId, accessionNumber, sampleRejectionReason: undefined };
    }

    const isRejected = row.sampleStatus === 'rejected';
    if (!isRejected) {
      return { showBanner: false, sampleId, accessionNumber, sampleRejectionReason: undefined };
    }

    return {
      showBanner: true,
      sampleId,
      accessionNumber,
      sampleRejectionReason: row.sampleRecollectionReason ?? undefined,
    };
  }, [row.sampleId, row.accessionNumber, row.sampleStatus, row.sampleRecollectionReason, row.status]);
}

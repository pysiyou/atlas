/**
 * Whether to show rejected-sample banner for a resulted validation work item.
 */
import { useMemo } from 'react';
import { useSampleLookup } from '../api/samples';
import { getSampleRejectionReasonLabel } from '../utils/labFormatters';
import type { TestWithContext } from '@/types';

export function useSampleRejectionDisplay(test: TestWithContext) {
  const { getSample } = useSampleLookup();

  return useMemo(() => {
    if (!test.sampleId || test.status !== 'resulted') {
      return { showBanner: false, sampleId: test.sampleId, sampleRejectionReason: undefined };
    }

    const sample = getSample(test.sampleId);
    const isRejected = sample?.status === 'rejected' || test.sampleStatus === 'rejected';
    if (!isRejected) {
      return { showBanner: false, sampleId: test.sampleId, sampleRejectionReason: undefined };
    }

    const sampleRejectionReason = sample
      ? getSampleRejectionReasonLabel(sample) ?? undefined
      : undefined;

    return {
      showBanner: true,
      sampleId: test.sampleId,
      sampleRejectionReason,
    };
  }, [getSample, test.sampleId, test.sampleStatus, test.status]);
}

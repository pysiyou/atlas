/**
 * Retest / recollection display state for queue cards and modals.
 */
import { LAB_CONFIG } from '../constants';
import type { LabOrderTestQueueRow } from '../types/labQueueChrome';

export interface TestRetestContext {
  isRetest: boolean;
  retestNumber: number;
  isSampleRecollection: boolean;
  sampleRecollectionAttempt: number;
  showAttemptInMeta: boolean;
  showAttemptIndicator: boolean;
  attemptNumber: number;
  attemptMax: number;
  attemptType: 'retest' | 'recollection';
  showRetestBadge: boolean;
  showRecollectionBadge: boolean;
  showRecollectionLink: boolean;
}

export function deriveRetestContextFromRow(row: Pick<
  LabOrderTestQueueRow,
  | 'isRetest'
  | 'retestNumber'
  | 'retestOfTestId'
  | 'sampleIsRecollection'
  | 'sampleRecollectionAttempt'
  | 'sampleOriginalSampleId'
>): TestRetestContext {
  const isRetest = row.isRetest === true;
  const retestNumber = row.retestNumber ?? 0;
  const isSampleRecollection = row.sampleIsRecollection === true;
  const sampleRecollectionAttempt = row.sampleRecollectionAttempt ?? 1;

  const attemptNumber = isRetest ? retestNumber + 1 : sampleRecollectionAttempt;
  const showAttemptInMeta =
    attemptNumber > 1 && (isRetest || (isSampleRecollection && !isRetest));
  const showAttemptIndicator = showAttemptInMeta;
  const attemptMax = isRetest
    ? LAB_CONFIG.MAX_RETEST_ATTEMPTS
    : LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS;
  const attemptType: 'retest' | 'recollection' = isRetest ? 'retest' : 'recollection';

  return {
    isRetest,
    retestNumber,
    isSampleRecollection,
    sampleRecollectionAttempt,
    showAttemptInMeta,
    showAttemptIndicator,
    attemptNumber,
    attemptMax,
    attemptType,
    showRetestBadge: isRetest && !!row.retestOfTestId,
    showRecollectionBadge: isSampleRecollection && !isRetest,
    showRecollectionLink:
      isSampleRecollection && !isRetest && row.sampleOriginalSampleId != null,
  };
}

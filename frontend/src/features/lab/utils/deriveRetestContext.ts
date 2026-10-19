/**
 * Derives retest / recollection display state from a TestWithContext.
 */
import { LAB_CONFIG } from '../constants';
import type { TestWithContext } from '@/types';

export interface TestRetestContext {
  isRetest: boolean;
  retestNumber: number;
  isSampleRecollection: boolean;
  sampleRecollectionAttempt: number;
  /** Matches collection cards: show Attempt N/M in the operational meta row */
  showAttemptInMeta: boolean;
  showAttemptIndicator: boolean;
  /** 1-based UI slot (original run = 1, first re-test = 2, …) — same scale as recollectionAttempt */
  attemptNumber: number;
  attemptMax: number;
  attemptType: 'retest' | 'recollection';
  showRetestBadge: boolean;
  showRecollectionBadge: boolean;
  showRecollectionLink: boolean;
}

export function deriveRetestContext(test: TestWithContext): TestRetestContext {
  const isRetest = test.isRetest === true;
  const retestNumber = test.retestNumber ?? 0;
  const isSampleRecollection = test.sampleIsRecollection === true;
  const sampleRecollectionAttempt = test.sampleRecollectionAttempt ?? 1;

  const attemptNumber = isRetest ? retestNumber + 1 : sampleRecollectionAttempt;
  const showAttemptInMeta =
    attemptNumber > 1 &&
    (isRetest || (isSampleRecollection && !isRetest));
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
    showRetestBadge: isRetest && !!test.retestOfTestId,
    showRecollectionBadge: isSampleRecollection && !isRetest,
    showRecollectionLink:
      isSampleRecollection && !isRetest && test.sampleOriginalSampleId != null,
  };
}

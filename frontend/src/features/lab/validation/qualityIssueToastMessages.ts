/**
 * Toast copy for quality issue outcomes — maps API {@link QualityIssueResult} to catalog ids.
 */
import type { FeedbackId } from '@/types/generated/feedback';
import {
  DEFAULT_QUALITY_ISSUE_SUCCESS_TOAST,
  QUALITY_ISSUE_SUCCESS_TOAST_RULES,
} from '@/types/generated/policies';
import { notify } from '@/feedback';
import type { QualityIssueResult } from '@/types';

function ruleMatches(
  when: { escalationRequired?: boolean; createdSample?: boolean },
  result: QualityIssueResult,
): boolean {
  if (
    when.escalationRequired != null &&
    when.escalationRequired !== Boolean(result.escalationRequired)
  ) {
    return false;
  }
  if (when.createdSample != null && when.createdSample !== (result.createdSampleId != null)) {
    return false;
  }
  return true;
}

/**
 * Pick catalog toast id from remedy outcome using `lab-policy.json` successToasts.
 */
export function resolveQualityIssueSuccessToast(result?: QualityIssueResult | null): FeedbackId {
  if (!result) {
    return DEFAULT_QUALITY_ISSUE_SUCCESS_TOAST;
  }

  const match = QUALITY_ISSUE_SUCCESS_TOAST_RULES.find(
    rule => rule.remedy === result.remedy && ruleMatches(rule.when, result),
  );
  return match?.feedbackId ?? DEFAULT_QUALITY_ISSUE_SUCCESS_TOAST;
}

/** Show success toast for a quality-issue / rejection outcome. */
export function notifyQualityIssueSuccess(result?: QualityIssueResult | null): void {
  notify.show(resolveQualityIssueSuccessToast(result));
}

/**
 * Toast copy for quality issue outcomes — maps API {@link QualityIssueResult} to catalog ids.
 */
import type { FeedbackId } from '@/types/generated/feedbackCatalog';
import { DEFAULT_QUALITY_ISSUE_SUCCESS_TOAST } from '@/types/generated/labContract';
import { notify } from '@/feedback';
import type { QualityIssueResult } from '@/types/lab-operations';

/**
 * Pick catalog toast id from remedy outcome (recollection vs reject-only, retest vs escalate).
 */
export function resolveQualityIssueSuccessToast(result?: QualityIssueResult | null): FeedbackId {
  if (!result) {
    return DEFAULT_QUALITY_ISSUE_SUCCESS_TOAST;
  }

  const { remedy, escalationRequired, createdSampleId, message } = result;
  const msg = (message ?? '').toLowerCase();

  if (remedy === 'request_recollection') {
    return createdSampleId != null
      ? 'lab.qualityIssue.recollection.requested'
      : 'lab.qualityIssue.specimenRejected';
  }

  if (remedy === 'retry_same_sample') {
    return escalationRequired ? 'lab.qualityIssue.retest.limitHit' : 'lab.qualityIssue.retest';
  }

  if (remedy === 'escalate') {
    if (escalationRequired && (msg.includes('re-test') || msg.includes('retest'))) {
      return 'lab.qualityIssue.retest.limitHit';
    }
    if (escalationRequired) {
      return 'lab.qualityIssue.escalate.limitHit';
    }
    return 'lab.qualityIssue.escalate';
  }

  if (remedy === 'cancel') {
    return 'lab.qualityIssue.cancelled';
  }

  return DEFAULT_QUALITY_ISSUE_SUCCESS_TOAST;
}

/** Show success toast for a quality-issue / rejection outcome. */
export function notifyQualityIssueSuccess(result?: QualityIssueResult | null): void {
  notify.show(resolveQualityIssueSuccessToast(result));
}

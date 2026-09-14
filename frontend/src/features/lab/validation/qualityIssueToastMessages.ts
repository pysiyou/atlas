/**
 * Toast copy for quality issue outcomes — backed by feedback catalog.
 */
import type { FeedbackId } from '@/config/feedbackCatalog';
import { notify } from '@/utils/feedback';
import type { QualityIssueResult } from '@/types/lab-operations';

function resolveQualityIssueSuccess(
  result?: QualityIssueResult | null
): { id: FeedbackId; overrides?: { subtitle?: string } } {
  if (!result) {
    return { id: 'lab.qualityIssue.reported' };
  }

  switch (result.remedy) {
    case 'escalate':
      return {
        id: result.escalationRequired
          ? 'lab.qualityIssue.escalate.limitHit'
          : 'lab.qualityIssue.escalate',
      };
    case 'retry_same_sample':
      return {
        id: result.escalationRequired
          ? 'lab.qualityIssue.retest.limitHit'
          : 'lab.qualityIssue.retest',
      };
    case 'request_recollection':
      if (result.recollectionRequestId) {
        return { id: 'lab.qualityIssue.recollection.requested' };
      }
      return {
        id: 'lab.qualityIssue.specimenRejected',
        overrides: result.message ? { subtitle: result.message } : undefined,
      };
    case 'cancel':
      return {
        id: 'lab.qualityIssue.cancelled',
        overrides: result.message ? { subtitle: result.message } : undefined,
      };
    default:
      return {
        id: 'lab.qualityIssue.reported',
        overrides: result.message ? { subtitle: result.message } : undefined,
      };
  }
}

/** Show success toast for a quality-issue / rejection outcome. */
export function notifyQualityIssueSuccess(result?: QualityIssueResult | null): void {
  const { id, overrides } = resolveQualityIssueSuccess(result);
  notify.toast(id, overrides);
}

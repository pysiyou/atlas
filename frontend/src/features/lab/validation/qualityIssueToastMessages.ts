/**
 * Toast copy for quality issue outcomes.
 */
import type { QualityIssueResult } from '@/types/lab-operations';

export function getRejectionToast(result?: QualityIssueResult | null): {
  title: string;
  subtitle: string;
} {
  if (!result) {
    return {
      title: 'Quality issue reported',
      subtitle: 'The issue has been recorded and the workflow updated.',
    };
  }

  switch (result.remedy) {
    case 'escalate':
      return {
        title: 'Escalated to supervisor',
        subtitle: 'This test has been sent to the escalation queue for supervisor review.',
      };
    case 'retry_same_sample':
      return {
        title: 'Re-test requested',
        subtitle: 'A new result entry has been created using the same sample.',
      };
    case 'request_recollection':
      if (result.recollectionRequestId) {
        return {
          title: 'Recollection request submitted',
          subtitle: 'A supervisor will review before the patient is contacted.',
        };
      }
      return {
        title: 'Specimen rejected',
        subtitle:
          result.message ||
          'Linked resulted tests remain in Review for validator decision.',
      };
    case 'cancel':
      return {
        title: 'Cancelled',
        subtitle: result.message || 'The selected work item(s) were cancelled.',
      };
    default:
      return {
        title: 'Quality issue reported',
        subtitle: result.message || 'The issue has been recorded.',
      };
  }
}

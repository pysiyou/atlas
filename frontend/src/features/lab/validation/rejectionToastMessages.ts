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
    case 'recollect':
      return {
        title: 'Recollection approved',
        subtitle: 'A pending collection tube has been created for the patient redraw.',
      };
    case 'request_recollection':
      return {
        title: 'Redraw request submitted',
        subtitle: 'A supervisor will review before the patient is contacted.',
      };
    default:
      return {
        title: 'Quality issue reported',
        subtitle: result.message || 'The issue has been recorded.',
      };
  }
}

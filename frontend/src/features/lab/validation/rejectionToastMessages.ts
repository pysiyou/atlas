/**
 * Toast copy for result rejection outcomes (re-test, re-collect, escalate).
 */

import type { RejectionResult } from '@/types/lab-operations';

export function getRejectionToast(result?: RejectionResult | null): {
  title: string;
  subtitle: string;
} {
  if (!result) {
    return {
      title: 'Results rejected',
      subtitle: 'The rejection has been recorded and the test status updated.',
    };
  }

  switch (result.action) {
    case 'escalate':
      return {
        title: 'Escalated to supervisor',
        subtitle:
          'This test has been sent to the escalation queue for supervisor review.',
      };
    case 'retest_same_sample':
      return {
        title: 'Re-test requested',
        subtitle: 'A new result entry has been created using the same sample.',
      };
    case 'recollect_new_sample':
      return {
        title: 'New sample requested',
        subtitle: 'The sample has been rejected and recollection has been requested.',
      };
    default:
      return {
        title: 'Results rejected',
        subtitle: result.message || 'The rejection has been recorded.',
      };
  }
}

/**
 * QualityIssueDialog - Copy and layout constants
 * Single place for all user-visible strings and magic numbers.
 */

import { LAB_CONFIG } from '@/features/lab/constants';
import type { QualityIssueOptions } from '@/types/lab-operations';

export const QUALITY_ISSUE_DIALOG_LAYOUT = {
  /** Width class for loading/error/content containers */
  widthClass: 'w-90 md:w-96',
  /** Textarea rows for rejection/escalation reason */
  reasonTextareaRows: 3,
  /** Popover offset from trigger (px) */
  popoverOffset: LAB_CONFIG.POPOVER_OFFSET,
} as const;

export const QUALITY_ISSUE_DIALOG_COPY = {
  loading: {
    message: 'Loading options...',
  },
  error: {
    title: 'Failed to load options',
    cancel: 'Cancel',
    retry: 'Retry',
  },
  escalation: {
    title: 'Reject Results',
    confirmLabel: 'Submit Rejection',
    warningTitle: 'Re-test Limit Reached',
    warningBody:
      'Re-test attempts are exhausted. You can still choose re-test — it will escalate to a supervisor for approval before another run.',
    reasonLabel: 'Rejection Reason',
    notesLabel: 'Additional Context / Notes',
  },
  reject: {
    title: 'Reject Results',
    confirmLabel: 'Submit Rejection',
    warningTitle: 'Choose Next Step',
    warningBody:
      'Select a rejection reason and where to send this test. The system will not decide automatically.',
    reasonLabel: 'Result rejection reason',
    notesLabel: 'Additional Context / Notes',
  },
  actions: {
    followUpLabel: 'Send to',
    retestLabel: 'Re-test same sample',
    retestDescription: 'Supersede this result and create a new entry on the same tube.',
    newSampleLabel: 'Request recollection',
    newSampleDescription:
      'Reject the specimen and submit a recollection request — supervisor must approve before the patient is redrawn.',
    cancelLabel: 'Cancel this test',
    cancelDescription: 'Close this test line. Other tests on the order are not affected.',
    retestLimitDescription:
      'Re-test limit reached. Submitting will escalate to a supervisor for approval.',
    retestSupervisorHint: '(supervisor approval required)',
  },
  recollectBlocked: 'Cannot collect new sample - order has validated tests',
  triggerTitle: 'Reject',
  collection: {
    recollect: {
      warningTitle: 'Reject Specimen',
      warningBody:
        'Decide what happens to unfinished tests. Resulted tests stay in Review with a Specimen rejected signal. Validated results stay released.',
      reasonLabel: 'Specimen Issue',
      notesLabel: 'Additional Context / Notes',
    },
    escalateResults: {
      warningTitle: 'Linked Tests Have Results',
      warningBody:
        'Resulted tests will stay in Review for the validator. Validated results will remain released.',
      reasonLabel: 'Specimen Issue',
      notesLabel: 'Additional Context / Notes',
    },
    actions: {
      followUpLabel: 'Unfinished linked tests',
      recollectLabel: 'Request recollection',
      recollectDescription: 'Supervisor must approve before the patient is contacted for a new sample.',
      cancelUnfinishedLabel: 'Cancel unfinished tests',
      cancelUnfinishedDescription: 'Cancel pending / sample-collected tests on this tube. Resulted and validated stay.',
    },
  },
} as const;

export interface ValidationAlertCopy {
  variant: 'warning' | 'danger';
  warningTitle: string;
  warningBody: string;
  confirmLabel: string;
  reasonLabel: string;
  notesLabel: string;
}

/** Dialog copy for validation rejection — destination is always operator-chosen. */
export function getValidationAlertCopy(options: QualityIssueOptions): ValidationAlertCopy {
  if (options.willEscalate) {
    return {
      variant: 'danger',
      ...QUALITY_ISSUE_DIALOG_COPY.escalation,
    };
  }
  return {
    variant: 'warning',
    warningTitle: QUALITY_ISSUE_DIALOG_COPY.reject.warningTitle,
    warningBody: options.previewMessage || QUALITY_ISSUE_DIALOG_COPY.reject.warningBody,
    confirmLabel: QUALITY_ISSUE_DIALOG_COPY.reject.confirmLabel,
    reasonLabel: QUALITY_ISSUE_DIALOG_COPY.reject.reasonLabel,
    notesLabel: QUALITY_ISSUE_DIALOG_COPY.reject.notesLabel,
  };
}

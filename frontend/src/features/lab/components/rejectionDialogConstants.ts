/**
 * RejectionDialog - Copy and layout constants
 * Single place for all user-visible strings and magic numbers.
 */

import { LAB_CONFIG } from '@/features/lab/constants';
import type { QualityIssueOptions } from '@/types/lab-operations';

export const REJECTION_DIALOG_LAYOUT = {
  /** Width class for loading/error/content containers */
  widthClass: 'w-90 md:w-96',
  /** Textarea rows for rejection/escalation reason */
  reasonTextareaRows: 3,
  /** Popover offset from trigger (px) */
  popoverOffset: LAB_CONFIG.POPOVER_OFFSET,
} as const;

export const REJECTION_DIALOG_COPY = {
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
      'Re-test attempts are exhausted. Escalate or cancel is recommended — you still choose the destination.',
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
    newSampleDescription: 'Reject the specimen and ask a supervisor to approve a patient redraw.',
    cancelLabel: 'Cancel this test',
    cancelDescription: 'Close this test line. Other tests on the order are not affected.',
    escalateLabel: 'Escalate to supervisor',
    escalateDescription: 'Send to the supervisor queue for decision.',
    remaining: (n: number) => ` (${n} left)`,
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
    escalateLimit: {
      warningTitle: 'Recollection Limit Reached',
      warningBody:
        'Recollection attempts are exhausted. Supervisor override will be required if recollection is approved.',
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
      ...REJECTION_DIALOG_COPY.escalation,
    };
  }
  return {
    variant: 'warning',
    warningTitle: REJECTION_DIALOG_COPY.reject.warningTitle,
    warningBody: options.previewMessage || REJECTION_DIALOG_COPY.reject.warningBody,
    confirmLabel: REJECTION_DIALOG_COPY.reject.confirmLabel,
    reasonLabel: REJECTION_DIALOG_COPY.reject.reasonLabel,
    notesLabel: REJECTION_DIALOG_COPY.reject.notesLabel,
  };
}

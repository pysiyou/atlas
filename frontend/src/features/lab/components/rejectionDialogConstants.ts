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
    confirmLabel: 'Reject & Escalate',
    warningTitle: 'Rejection Limit Reached',
    warningBody:
      'This rejection will escalate automatically. A supervisor will decide the next step.',
    reasonLabel: 'Rejection Reason',
    notesLabel: 'Additional Context / Notes',
  },
  reject: {
    title: 'Reject Results',
    confirmLabel: 'Reject & Re-test',
    warningTitle: 'Re-test on Same Sample',
    warningBody:
      'The test will be run again on the current sample. If rejected again, it escalates to a supervisor automatically.',
    reasonLabel: 'Rejection Reason',
    notesLabel: 'Additional Context / Notes',
  },
  actions: {
    followUpLabel: 'Choose an Action',
    retestLabel: 'Try Again with This Sample',
    retestDescription: 'Run the test again using the same sample.',
    newSampleLabel: 'Collect New Sample',
    newSampleDescription: 'Get a fresh sample from the patient and retest.',
    escalateLabel: 'Escalate to Supervisor',
    escalateDescription: 'Let a supervisor decide the next step.',
    remaining: (n: number) => ` (${n} left)`,
  },
  recollectBlocked: 'Cannot collect new sample - order has validated tests',
  triggerTitle: 'Reject',
  collection: {
    recollect: {
      warningTitle: 'Supervisor Approval Required',
      warningBody:
        'This specimen will be rejected. A supervisor must approve before the patient is contacted for redraw.',
      reasonLabel: 'Specimen Issue',
      notesLabel: 'Additional Context / Notes',
    },
    escalateLimit: {
      warningTitle: 'Recollection Limit Reached',
      warningBody:
        'This rejection will escalate automatically. A supervisor will decide the next step.',
      reasonLabel: 'Specimen Issue',
      notesLabel: 'Additional Context / Notes',
    },
    escalateResults: {
      warningTitle: 'Supervisor Review Required',
      warningBody:
        'Linked tests already have results. Reporting this specimen issue will escalate to a supervisor for review.',
      reasonLabel: 'Specimen Issue',
      notesLabel: 'Additional Context / Notes',
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

/** Dialog copy derived from GET /lab/quality-issues/options preview fields. */
export function getValidationAlertCopy(options: QualityIssueOptions): ValidationAlertCopy {
  if (options.willEscalate) {
    return {
      variant: 'danger',
      ...REJECTION_DIALOG_COPY.escalation,
    };
  }
  if (options.previewRemedy === 'request_recollection' || options.previewRemedy === 'recollect') {
    return {
      variant: 'warning',
      warningTitle: 'Supervisor Approval Required',
      warningBody:
        options.previewMessage ||
        'A supervisor must approve before the patient is contacted for redraw.',
      confirmLabel: 'Submit Redraw Request',
      reasonLabel: REJECTION_DIALOG_COPY.reject.reasonLabel,
      notesLabel: REJECTION_DIALOG_COPY.reject.notesLabel,
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

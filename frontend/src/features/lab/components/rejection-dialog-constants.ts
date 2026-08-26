/**
 * RejectionDialog - Copy and layout constants
 * Single place for all user-visible strings and magic numbers.
 */

export const REJECTION_DIALOG_LAYOUT = {
  /** Width class for loading/error/content containers */
  widthClass: 'w-90 md:w-96',
  /** Textarea rows for rejection/escalation reason */
  reasonTextareaRows: 3,
  /** Popover offset from trigger (px) */
  popoverOffset: 8,
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
    title: 'Escalate to Supervisor',
    confirmLabel: 'Escalate to Supervisor',
    footerInfo: 'Escalating to supervisor',
    warningTitle: 'Supervisor Review Needed',
    warningBody: 'All retry options have been used. A supervisor will review and decide next steps.',
    reasonLabel: 'Why escalate?',
    reasonPlaceholder: 'Explain why this needs supervisor review...',
  },
  reject: {
    title: 'What Would You Like to Do?',
    confirmLabel: 'Continue',
    footerInfo: 'Processing request',
    warningTitle: 'Choose an Action',
    warningBody: 'Select how you would like to proceed with this test.',
    reasonLabel: 'Reason',
    reasonPlaceholder: 'Explain why this action is needed...',
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
} as const;

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
    message: 'Loading rejection options...',
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
    warningTitle: 'Escalation Required',
    warningBody: 'All rejection options have been exhausted. Please escalate to your supervisor.',
    reasonLabel: 'Reason for escalation',
    reasonPlaceholder: 'Please provide a reason for escalating to your supervisor...',
  },
  reject: {
    title: 'Reject Results',
    confirmLabel: 'Reject',
    footerInfo: 'Rejecting results',
    warningTitle: 'Action Required',
    warningBody: 'You are rejecting results. Please specify the required follow-up action.',
    reasonLabel: 'Rejection Reason',
    reasonPlaceholder: 'Please explain why the results are being rejected...',
  },
  actions: {
    followUpLabel: 'Follow-up Action',
    retestLabel: 'Re-test Sample',
    retestDescription: 'Perform the test again using the existing sample.',
    newSampleLabel: 'New Sample Required',
    newSampleDescription: 'Reject current sample and request new collection.',
    remaining: (n: number) => ` (${n} remaining)`,
  },
  recollectBlocked: 'Order has validated tests - sample cannot be rejected',
  triggerTitle: 'Reject Results',
} as const;

/**
 * Popover Footer Constants
 * Standardized footer messages for lab workflow popovers
 */

export const POPOVER_FOOTER_MESSAGES = {
  /** Collection popover footer */
  COLLECTING_SAMPLE: 'Collecting sample',
  
  /** Rejection popover footer */
  REJECTING_SAMPLE: 'Rejecting sample',
  
  /** Default lab workflow message */
  LAB_WORKFLOW: 'Lab workflow',
  
  /** Generic "Acting as" prefix for user context */
  ACTING_AS: (userName: string) => `Acting as ${userName}`,
} as const;

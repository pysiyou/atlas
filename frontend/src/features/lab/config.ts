/**
 * Lab Workflow Configuration
 * Centralized configuration for lab feature constants
 */

export const LAB_CONFIG = {
  /** Maximum retest attempts before escalation required */
  MAX_RETEST_ATTEMPTS: 3,
  
  /** Maximum recollection attempts before escalation required */
  MAX_RECOLLECTION_ATTEMPTS: 3,
  
  /** Search input debounce in milliseconds */
  SEARCH_DEBOUNCE_MS: 300,
  
  /** Default textarea rows for notes/comments */
  DEFAULT_TEXTAREA_ROWS: 2,
  
  /** Rejection dialog textarea rows */
  REJECTION_TEXTAREA_ROWS: 3,
  
  /** Number of parameters to preview in entry card */
  PARAMETER_PREVIEW_LIMIT: 5,
  
  /** Auto-refresh interval for tab counts (milliseconds) */
  TAB_COUNT_REFRESH_MS: 30000,
  
  /** Maximum visible results in compact result grid */
  COMPACT_RESULT_GRID_LIMIT: 8,
  
  /** Popover offset value (pixels) */
  POPOVER_OFFSET: 8,
  
  /** Modal sizes */
  MODAL_SIZE_DEFAULT: '3xl' as const,
  MODAL_SIZE_LARGE: '4xl' as const,
  
  /** Validation error display duration (milliseconds) */
  VALIDATION_ERROR_DISPLAY_MS: 3000,

  /** Queue age thresholds for SLA badges (hours) */
  QUEUE_AGE_WARNING_HOURS: 4,
  QUEUE_AGE_CRITICAL_HOURS: 8,
} as const;

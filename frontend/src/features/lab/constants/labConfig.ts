/**
 * Lab workflow numeric configuration and UI constants.
 */

import { GENERATED_LAB_CONSTANTS } from '@/types/generated/labConstants';

export const LAB_CONFIG = {
  MAX_RETEST_ATTEMPTS: GENERATED_LAB_CONSTANTS.MAX_RETEST_ATTEMPTS,
  MAX_RECOLLECTION_ATTEMPTS: GENERATED_LAB_CONSTANTS.MAX_RECOLLECTION_ATTEMPTS,
  SEARCH_DEBOUNCE_MS: 300,
  /** Min characters before collection search queries historical samples (sample ID or patient name). */
  SAMPLE_LOOKUP_MIN_CHARS: 3,
  DEFAULT_TEXTAREA_ROWS: 2,
  REJECTION_TEXTAREA_ROWS: 3,
  PARAMETER_PREVIEW_LIMIT: 5,
  /** Tab badge / worklist poll interval */
  TAB_COUNT_REFRESH_MS: 30_000,
  /** Command center timeline poll interval */
  COMMAND_CENTER_REFETCH_MS: 60_000,
  /** Command center query stale window (half of refetch interval) */
  COMMAND_CENTER_STALE_MS: 30_000,
  COMPACT_RESULT_GRID_LIMIT: 8,
  POPOVER_OFFSET: 8,
  MODAL_SIZE_DEFAULT: '3xl' as const,
  MODAL_SIZE_LARGE: '4xl' as const,
  VALIDATION_ERROR_DISPLAY_MS: 3000,
  QUEUE_AGE_WARNING_HOURS: GENERATED_LAB_CONSTANTS.QUEUE_AGE_WARNING_HOURS,
  QUEUE_AGE_CRITICAL_HOURS: GENERATED_LAB_CONSTANTS.QUEUE_AGE_CRITICAL_HOURS,
} as const;

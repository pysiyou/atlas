/**
 * Application-wide constants
 * Centralized configuration for magic numbers and hardcoded values
 */

/**
 * Animation timing configuration
 */
export const ANIMATION_CONFIG = {
  /** Delay values for staggered login form animations */
  loginFormDelays: ['1s', '2s'] as const,
} as const;

/**
 * Pagination configuration
 */
export const PAGINATION_CONFIG = {
  /** Default number of items per page */
  defaultPageSize: 10,
  /** Number of samples to show in preview */
  samplePreviewLimit: 5,
  /** Number of tests to show in preview */
  testPreviewLimit: 10,
} as const;

/**
 * Date range configuration for calendars and date pickers
 */
export const DATE_RANGE_CONFIG = {
  /** Maximum years back for date selection */
  maxYearsBack: 10,
  /** Maximum years forward for date selection */
  maxYearsForward: 1,
} as const;

/**
 * Table column width configuration
 */
export const TABLE_COLUMN_WIDTHS = {
  small: '8%',
  medium: '12%',
  large: '20%',
  xlarge: '30%',
} as const;

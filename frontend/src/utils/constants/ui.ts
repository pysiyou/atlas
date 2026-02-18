/**
 * UI Constants
 * Shared UI constants, magic numbers, and limits
 */

/**
 * Common pagination sizes
 */
export const PAGINATION_SIZES = [10, 20, 50, 100] as const;

/**
 * Default pagination size
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Maximum items to display before truncating
 */
export const MAX_DISPLAY_ITEMS = {
  TESTS_IN_CARD: 2,
  TESTS_IN_TABLE: 2,
  DOTS_IN_TIMELINE: 6,
} as const;

/**
 * Price range defaults
 */
export const PRICE_RANGE = {
  MIN: 0,
  MAX: 10000,
} as const;

/**
 * Age range defaults
 */
export const AGE_RANGE = {
  MIN: 0,
  MAX: 120,
} as const;

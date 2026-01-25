/**
 * Design System Constants
 *
 * Centralized design tokens for consistent styling across the application.
 */

import { semanticColors } from './tokens/colors';

/**
 * Spacing constants for consistent gaps and padding
 */
export const SPACING = {
  card: {
    padding: 'p-4',
    gap: 'gap-4',
  },
  section: {
    padding: 'p-6',
    gap: 'gap-6',
  },
  list: {
    gap: 'gap-2',
  },
  grid: {
    gap: {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
    },
  },
  page: {
    padding: 'p-4 md:p-6',
    gap: 'gap-4 md:gap-6',
  },
} as const;

/**
 * Typography constants for consistent text styling
 */
export const TYPOGRAPHY = {
  heading: {
    h1: 'text-2xl font-bold text-gray-900',
    h2: 'text-xl font-semibold text-gray-900',
    h3: 'text-lg font-medium text-gray-900',
    h4: 'text-base font-medium text-gray-900',
  },
  body: {
    default: 'text-sm text-gray-700',
    small: 'text-xs text-gray-600',
    metadata: 'text-xs text-gray-500',
    muted: 'text-sm text-gray-500',
  },
  label: {
    default: 'text-xs font-medium text-gray-500',
    required: 'text-xs font-medium text-gray-500',
    uppercase: 'text-xs font-medium text-gray-500 uppercase tracking-wide',
  },
  code: {
    inline: 'font-mono text-xs text-sky-600',
    block: 'font-mono text-sm',
  },
} as const;

/**
 * Color palette for status, priority, and semantic colors
 * 
 * NOTE: This file exists but is NOT being used (0 imports found).
 * Will be enhanced and migrated to new token system.
 */
export const COLORS = {
  status: {
    success: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    error: 'text-red-600 bg-red-50 border-red-200',
    info: 'text-sky-600 bg-sky-50 border-sky-200',
    neutral: 'text-gray-600 bg-gray-50 border-gray-200',
  },
  priority: {
    urgent: 'text-red-600 bg-red-50',
    stat: `${semanticColors.warning.valueHigh} ${semanticColors.warning.backgroundLight}`,
    routine: 'text-gray-600 bg-gray-50',
  },
  interactive: {
    primary: 'text-sky-600 hover:text-sky-700',
    secondary: 'text-gray-600 hover:text-gray-700',
    danger: 'text-red-600 hover:text-red-700',
  },
} as const;

/**
 * Border radius constants
 */
export const RADIUS = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const;

/**
 * Shadow constants
 */
export const SHADOW = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
} as const;

/**
 * Transition constants
 */
export const TRANSITION = {
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-200',
  slow: 'transition-all duration-300',
  colors: 'transition-colors duration-200',
  shadow: 'transition-shadow duration-200',
} as const;

/**
 * Z-index layers
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const;

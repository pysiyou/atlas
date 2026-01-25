/**
 * Animation and Transition Tokens
 *
 * Centralized animation timings, transitions, and loading state colors
 * for consistent motion and visual feedback across all components.
 */

/**
 * Transition Duration Tokens
 */
export const duration = {
  fast: 'duration-150',
  normal: 'duration-200',
  slow: 'duration-300',
  slower: 'duration-500',
} as const;

/**
 * Transition Property Tokens
 */
export const transitions = {
  none: 'transition-none',
  all: 'transition-all duration-200',
  allFast: 'transition-all duration-150',
  allSlow: 'transition-all duration-300',
  colors: 'transition-colors duration-200',
  colorsFast: 'transition-colors duration-150',
  opacity: 'transition-opacity duration-200',
  shadow: 'transition-shadow duration-200',
  transform: 'transition-transform duration-200',
  transformFast: 'transition-transform duration-150',
} as const;

/**
 * Animation Tokens
 */
export const animations = {
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
  ping: 'animate-ping',
} as const;

/**
 * Loading State Colors
 * Colors used for loading indicators, skeletons, and progress components
 */
export const loadingColors = {
  primary: 'text-emerald-500',
  primaryHex: '#10b981',
  secondary: 'text-emerald-600',
  secondaryHex: '#059669',
  track: 'text-gray-200',
  trackStroke: 'stroke-gray-200',
  progressStroke: 'stroke-emerald-500',
  skeleton: {
    background: 'bg-gray-200',
    shimmer: 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200',
  },
  spinner: {
    border: 'border-gray-200',
    borderActive: 'border-t-emerald-500',
  },
} as const;

/**
 * Animation Utilities Object
 * Grouped export for easy access
 */
export const animationTokens = {
  duration,
  transitions,
  animations,
  loading: loadingColors,
} as const;

/**
 * Interaction State Tokens
 *
 * Centralized interactive state patterns for consistent hover, focus,
 * active, disabled, and selected states across all components.
 */

import { brandColors, neutralColors } from './colors';

/**
 * Hover State Tokens
 */
export const hover = {
  background: 'hover:bg-gray-50',
  backgroundStrong: 'hover:bg-gray-100',
  backgroundPrimary: 'hover:bg-sky-700',
  text: 'hover:text-gray-900',
  textPrimary: 'hover:text-sky-700',
  border: 'hover:border-gray-300',
  shadow: 'hover:shadow-md',
} as const;

/**
 * Focus State Tokens
 */
export const focus = {
  ring: 'focus:ring-2 focus:ring-offset-2',
  ringPrimary: 'focus:ring-sky-500',
  ringDanger: 'focus:ring-red-500',
  outline: 'focus:outline-none',
  border: 'focus:border-sky-500',
  visible: 'focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
} as const;

/**
 * Active State Tokens
 */
export const active = {
  background: 'active:bg-gray-200',
  backgroundPrimary: 'active:bg-sky-800',
  scale: 'active:scale-95',
} as const;

/**
 * Disabled State Tokens
 */
export const disabled = {
  opacity: 'disabled:opacity-50',
  cursor: 'disabled:cursor-not-allowed',
  background: 'disabled:bg-gray-100',
  text: 'disabled:text-gray-400',
  combined: 'disabled:opacity-50 disabled:cursor-not-allowed',
} as const;

/**
 * Selected State Tokens
 */
export const selected = {
  background: 'bg-sky-50',
  backgroundStrong: 'bg-sky-100',
  border: 'border-sky-500',
  borderStrong: 'border-2 border-sky-500',
  text: 'text-sky-900',
  ring: 'ring-2 ring-sky-500',
} as const;

/**
 * Combined Interaction Patterns
 * Common combinations used across multiple components
 */
export const interactionPatterns = {
  clickable: `cursor-pointer ${hover.background} transition-colors`,
  clickableStrong: `cursor-pointer ${hover.backgroundStrong} transition-colors`,
  button: `${focus.outline} ${focus.ring} ${focus.ringPrimary} ${disabled.combined}`,
  input: `${focus.outline} ${focus.border} transition-colors`,
  card: `${hover.shadow} transition-shadow`,
  link: `${hover.textPrimary} transition-colors`,
} as const;

/**
 * Interactive State Object
 * Grouped export for easy access
 */
export const interactionStates = {
  hover,
  focus,
  active,
  disabled,
  selected,
  patterns: interactionPatterns,
} as const;

/**
 * Interaction State Tokens
 *
 * Centralized interactive state patterns for consistent hover, focus,
 * active, disabled, and selected states across all components.
 */

/**
 * Hover State Tokens
 */
export const hover = {
  background: 'hover:bg-surface-hover',
  backgroundStrong: 'hover:bg-neutral-100', // Need semantic var for neutral-100 really, but using direct map for now or surface-button?
  backgroundPrimary: 'hover:bg-brand-hover',
  text: 'hover:text-text-primary',
  textPrimary: 'hover:text-brand-hover',
  border: 'hover:border-border-strong',
  shadow: 'hover:shadow-md',
} as const;

/**
 * Focus State Tokens
 */
export const focus = {
  ring: 'focus:ring-2 focus:ring-offset-2',
  ringPrimary: 'focus:ring-brand',
  ringDanger: 'focus:ring-danger',
  outline: 'focus:outline-none',
  border: 'focus:border-brand',
  visible: 'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
} as const;

/**
 * Active State Tokens
 */
export const active = {
  background: 'active:bg-neutral-200',
  backgroundPrimary: 'active:bg-brand-text', // darker than hover
  scale: 'active:scale-95',
} as const;

/**
 * Disabled State Tokens
 */
export const disabled = {
  opacity: 'disabled:opacity-50',
  cursor: 'disabled:cursor-not-allowed',
  background: 'disabled:bg-neutral-100',
  text: 'disabled:text-text-disabled',
  combined: 'disabled:opacity-50 disabled:cursor-not-allowed',
} as const;

/**
 * Selected State Tokens
 */
export const selected = {
  background: 'bg-brand-light/50',
  backgroundStrong: 'bg-brand-light',
  border: 'border-brand',
  borderStrong: 'border-2 border-brand',
  text: 'text-brand-text',
  ring: 'ring-2 ring-brand',
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

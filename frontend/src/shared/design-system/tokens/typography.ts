/**
 * Typography Design Tokens
 * 
 * Consistent typography system for text styling.
 * Covers all 607 typography class usages across 122 files.
 */

/**
 * Font Sizes
 */
export const fontSize = {
  xxs: 'text-xxs', // 10px
  xs: 'text-xs',   // 12px
  sm: 'text-sm',   // 14px
  base: 'text-base', // 16px
  lg: 'text-lg',   // 18px
  xl: 'text-xl',   // 20px
  '2xl': 'text-2xl', // 24px
  '3xl': 'text-3xl', // 30px
} as const;

/**
 * Font Weights
 */
export const fontWeight = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const;

/**
 * Line Heights
 */
export const lineHeight = {
  none: 'leading-none',
  tight: 'leading-tight',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
} as const;

/**
 * Heading Styles
 */
/**
 * Heading Styles
 */
export const heading = {
  h1: 'text-2xl font-bold text-text-primary',
  h2: 'text-xl font-semibold text-text-primary',
  h3: 'text-lg font-medium text-text-primary',
  h4: 'text-base font-medium text-text-primary',
  h5: 'text-sm font-semibold text-text-primary',
  h6: 'text-xs font-semibold text-text-primary',
} as const;

/**
 * Body Text Styles
 */
export const body = {
  default: 'text-sm text-text-secondary',
  small: 'text-xs text-text-tertiary',
  metadata: 'text-xs text-text-muted',
  muted: 'text-sm text-text-muted',
  large: 'text-base text-text-secondary',
} as const;

/**
 * Label Styles
 */
export const label = {
  default: 'text-xs font-medium text-text-muted',
  required: 'text-xs font-medium text-text-muted',
  uppercase: 'text-xs font-medium text-text-muted uppercase tracking-wide',
  sm: 'text-xxs font-medium text-text-muted',
} as const;

/**
 * Code/Monospace Styles
 */
export const code = {
  inline: 'font-mono text-xs text-brand',
  block: 'font-mono text-sm',
  large: 'font-mono text-base',
} as const;

/**
 * Card Title Styles
 */
export const cardTitle = {
  default: 'text-sm font-medium text-text-primary',
  large: 'text-base font-semibold text-text-primary',
} as const;

/**
 * Section Title Styles
 */
export const sectionTitle = {
  default: 'text-sm font-medium text-text-secondary',
  large: 'text-base font-semibold text-text-primary',
} as const;

/**
 * Helper Text Styles
 */
export const helper = {
  default: 'text-xs text-text-muted',
  error: 'text-sm text-danger',
  success: 'text-xs text-success',
} as const;

/**
 * Error Message Styles
 */
export const error = {
  text: 'text-sm text-danger',
  textSmall: 'text-xs text-danger',
} as const;

/**
 * Required Indicator
 */
export const required = {
  indicator: 'text-danger ml-1',
} as const;


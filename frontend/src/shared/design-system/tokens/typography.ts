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
  xxs: 'text-xxs', // 10px (custom theme variable)
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
export const heading = {
  h1: 'text-2xl font-bold text-gray-900',
  h2: 'text-xl font-semibold text-gray-900',
  h3: 'text-lg font-medium text-gray-900',
  h4: 'text-base font-medium text-gray-900',
  h5: 'text-sm font-semibold text-gray-900',
  h6: 'text-xs font-semibold text-gray-900',
} as const;

/**
 * Body Text Styles
 */
export const body = {
  default: 'text-sm text-gray-700',
  small: 'text-xs text-gray-600',
  metadata: 'text-xs text-gray-500',
  muted: 'text-sm text-gray-500',
  large: 'text-base text-gray-700',
} as const;

/**
 * Label Styles
 */
export const label = {
  default: 'text-xs font-medium text-gray-500',
  required: 'text-xs font-medium text-gray-500',
  uppercase: 'text-xs font-medium text-gray-500 uppercase tracking-wide',
  sm: 'text-xxs font-medium text-gray-500',
} as const;

/**
 * Code/Monospace Styles
 */
export const code = {
  inline: 'font-mono text-xs text-sky-600',
  block: 'font-mono text-sm',
  large: 'font-mono text-base',
} as const;

/**
 * Card Title Styles
 */
export const cardTitle = {
  default: 'text-sm font-medium text-gray-900',
  large: 'text-base font-semibold text-gray-900',
} as const;

/**
 * Section Title Styles
 */
export const sectionTitle = {
  default: 'text-sm font-medium text-gray-700',
  large: 'text-base font-semibold text-gray-900',
} as const;

/**
 * Helper Text Styles
 */
export const helper = {
  default: 'text-xs text-gray-500',
  error: 'text-sm text-red-600',
  success: 'text-xs text-green-600',
} as const;

/**
 * Error Message Styles
 */
export const error = {
  text: 'text-sm text-red-600',
  textSmall: 'text-xs text-red-600',
} as const;

/**
 * Required Indicator
 */
export const required = {
  indicator: 'text-red-500 ml-1',
} as const;

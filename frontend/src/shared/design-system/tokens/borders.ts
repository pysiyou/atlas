/**
 * Border Design Tokens
 * 
 * Consistent border system for radius, width, and colors.
 * Covers all 260 border-radius usages across 92 files.
 */

/**
 * Border Radius
 */
export const radius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
  
  // Specific use cases
  input: 'rounded', // Default rounded (4px)
  button: 'rounded',
  card: 'rounded-lg',
  badge: 'rounded',
  modal: 'rounded-lg',
  popover: 'rounded-lg',
} as const;

/**
 * Border Width
 */
export const width = {
  none: 'border-0',
  thin: 'border',
  medium: 'border-2',
  thick: 'border-4',
  
  // Specific use cases
  default: 'border',
  input: 'border',
  card: 'border',
  left: 'border-l-4', // For rejection indicators
} as const;

/**
 * Border Colors (references color tokens)
 */
export const color = {
  default: 'border-border',
  medium: 'border-border-strong',
  strong: 'border-gray-400',
  
  // Focus states
  focus: 'border-brand',
  focusTransparent: 'border-transparent',
  
  // Error states
  error: 'border-red-500',
  
  // Semantic colors
  success: 'border-green-200',
  danger: 'border-red-200',
  warning: 'border-yellow-200',
  info: 'border-brand-light',
} as const;

/**
 * Combined Border Utilities
 */
export const border = {
  // Default borders
  default: 'border border-border',
  medium: 'border border-border-strong',
  
  // Input borders
  input: 'border border-border-strong',
  inputFocus: 'border-2 border-brand border-transparent',
  inputError: 'border border-red-500',
  
  // Card borders
  card: 'border border-border',
  
  // Rejection indicator (left border)
  rejection: 'border-l-4 border-l-yellow-400',
  
  // Divider
  divider: 'border-b border-border-subtle',
} as const;

/**
 * Shadow Design Tokens
 * 
 * Consistent shadow system for elevation and depth.
 * Covers all 47 shadow usages across 31 files.
 */

/**
 * Box Shadows
 */
export const shadow = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  
  // Specific use cases
  card: 'shadow-md',
  cardHover: 'hover:shadow-md',
  modal: 'shadow-xl',
  popover: 'shadow-lg',
  dropdown: 'shadow-md',
} as const;

/**
 * Transition for shadows
 */
export const shadowTransition = {
  default: 'transition-shadow duration-200',
  fast: 'transition-shadow duration-150',
  slow: 'transition-shadow duration-300',
} as const;

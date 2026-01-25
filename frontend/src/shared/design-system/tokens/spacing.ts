/**
 * Spacing Design Tokens
 * 
 * Consistent spacing system for padding, margins, and gaps.
 * Covers all 1,042 spacing class usages across 149 files.
 */

/**
 * Padding Tokens
 */
export const padding = {
  // Card padding
  card: {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
    xl: 'p-6',
  },
  
  // Input padding
  input: {
    base: 'px-3 py-2.5',
    withIcon: 'pl-10 pr-3 py-2.5',
    withIconRight: 'pl-3 pr-10 py-2.5',
    sm: 'px-2 py-1.5',
    md: 'px-3 py-2.5',
    lg: 'px-4 py-3',
  },
  
  // Button padding (matches button sizes)
  button: {
    xs: 'px-2 py-1',
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-6 py-3',
  },
  
  // Section padding
  section: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
  
  // Horizontal padding
  horizontal: {
    xs: 'px-1',
    sm: 'px-2',
    md: 'px-4',
    lg: 'px-6',
    xl: 'px-8',
  },
  
  // Vertical padding
  vertical: {
    xs: 'py-1',
    sm: 'py-2',
    md: 'py-3',
    lg: 'py-4',
    xl: 'py-6',
  },
  
  // Left padding (for icons, indentation)
  left: {
    xs: 'pl-1',
    sm: 'pl-2',
    md: 'pl-3',
    lg: 'pl-4',
    icon: 'pl-10', // For input with left icon
    iconSm: 'pl-9', // For smaller icon spacing
  },
  
  // Right padding
  right: {
    xs: 'pr-1',
    sm: 'pr-2',
    md: 'pr-3',
    lg: 'pr-4',
    icon: 'pr-10', // For input with right icon
  },
} as const;

/**
 * Margin Tokens
 */
export const margin = {
  // Bottom margin
  bottom: {
    xs: 'mb-1',
    sm: 'mb-2',
    md: 'mb-4',
    lg: 'mb-6',
    xl: 'mb-8',
  },
  
  // Top margin
  top: {
    xs: 'mt-1',
    sm: 'mt-2',
    md: 'mt-4',
    lg: 'mt-6',
    xl: 'mt-8',
  },
  
  // Left margin
  left: {
    xs: 'ml-1',
    sm: 'ml-2',
    md: 'ml-4',
    lg: 'ml-6',
  },
  
  // Right margin
  right: {
    xs: 'mr-1',
    sm: 'mr-2',
    md: 'mr-4',
    lg: 'mr-6',
  },
  
  // Horizontal margin
  horizontal: {
    xs: 'mx-1',
    sm: 'mx-2',
    md: 'mx-4',
    lg: 'mx-6',
  },
  
  // Vertical margin
  vertical: {
    xs: 'my-1',
    sm: 'my-2',
    md: 'my-4',
    lg: 'my-6',
  },
} as const;

/**
 * Gap Tokens (for flexbox and grid)
 */
export const gap = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  
  // Specific use cases
  card: 'gap-3',
  section: 'gap-4',
  list: 'gap-2',
  form: 'gap-4',
  buttonGroup: 'gap-2',
  badgeGroup: 'gap-2.5',
} as const;

/**
 * Space Between Tokens (for space-y, space-x utilities)
 */
export const spaceBetween = {
  xs: 'space-y-1',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6',
  horizontal: {
    xs: 'space-x-1',
    sm: 'space-x-2',
    md: 'space-x-4',
    lg: 'space-x-6',
  },
} as const;

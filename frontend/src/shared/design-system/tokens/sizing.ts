/**
 * Sizing Tokens
 *
 * Centralized component-specific sizing tokens for consistent
 * dimensions across UI elements like icons, controls, and containers.
 */

/**
 * Icon Size Tokens
 * Standard icon sizes used across the application
 */
export const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
  '3xl': 'w-12 h-12',
} as const;

/**
 * Filter Control Sizing
 * Consistent heights for filter bar controls
 * Widths are not constrained to allow flexible sizing
 */
export const filterControlSizing = {
  height: 'h-[34px] min-h-[34px] max-h-[34px]',
  heightLg: 'h-[38px] min-h-[38px] max-h-[38px]',
  minWidth: {
    search: '',
    filter: '',
    filterMedium: '',
    filterSmall: '',
  },
} as const;

/**
 * Avatar Sizes
 * Standard avatar dimensions
 */
export const avatarSizes = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20',
} as const;

/**
 * Table Column Width Tokens
 * Standard column widths for data tables
 */
export const tableColumnWidths = {
  xs: '8%',
  sm: '12%',
  md: '15%',
  lg: '20%',
  xl: '30%',
  code: '12%',
  name: '30%',
  category: '20%',
  sample: '15%',
  status: '15%',
  price: '8%',
  actions: '10%',
} as const;

/**
 * Container Max Widths
 * Standard max-width constraints
 */
export const containerWidths = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
  prose: 'max-w-prose',
  screen: {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
  },
} as const;

/**
 * Sizing Tokens Object
 * Grouped export for easy access
 */
export const sizingTokens = {
  icons: iconSizes,
  filterControls: filterControlSizing,
  avatars: avatarSizes,
  tableColumns: tableColumnWidths,
  containers: containerWidths,
} as const;

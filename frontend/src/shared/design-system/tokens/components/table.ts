/**
 * Table Component Tokens
 * 
 * Unified table styling tokens ensuring consistent table appearance.
 */

import { neutralColors } from '../colors';
import { border, radius } from '../borders';
import { padding } from '../spacing';
import { fontSize } from '../typography';

/**
 * Table Base Styles
 */
/**
 * Table Base Styles
 */
export const tableBase = {
  container: `flex flex-col h-full ${neutralColors.white}`,
  containerWithBorder: (embedded: boolean) => `flex flex-col h-full ${neutralColors.white} ${!embedded ? `${radius.md} ${border.default}` : ''}`,
  wrapper: (embedded: boolean) => `flex flex-col h-full ${!embedded ? `${radius.md} ${border.default}` : ''}`,
} as const;

/**
 * Table Variant Styles
 */
export const tableVariants = {
  compact: {
    cellPadding: `${padding.horizontal.md} ${padding.vertical.sm}`, // px-3 py-2
    headerPadding: `${padding.horizontal.md} ${padding.vertical.sm}`, // px-3 py-2
    textSize: fontSize.xs, // text-xs
    rowHeight: 44,
  },
  default: {
    cellPadding: `${padding.horizontal.lg} ${padding.vertical.md}`, // px-4 py-3
    headerPadding: `${padding.horizontal.lg} ${padding.vertical.md}`, // px-4 py-3
    textSize: fontSize.sm, // text-sm
    rowHeight: 56,
  },
  comfortable: {
    cellPadding: `${padding.horizontal.xl} ${padding.vertical.lg}`, // px-6 py-4
    headerPadding: `${padding.horizontal.xl} ${padding.vertical.lg}`, // px-6 py-4
    textSize: fontSize.sm, // text-sm
    rowHeight: 68,
  },
} as const;

/**
 * Table Header Styles
 */
export const tableHeader = {
  container: `bg-app-bg border-b border-border sticky top-0 z-10`,
  row: 'flex items-center',
  cell: (variant: keyof typeof tableVariants) => `${tableVariants[variant].headerPadding} ${tableVariants[variant].textSize} font-semibold text-text-secondary`,
} as const;

/**
 * Table Row Styles
 */
export const tableRow = {
  base: `flex items-center ${border.divider} transition-colors`,
  hover: 'hover:bg-surface-hover',
  striped: 'bg-app-bg',
  clickable: 'cursor-pointer',
} as const;

/**
 * Table Cell Styles
 */
export const tableCell = {
  base: (variant: keyof typeof tableVariants) => `${tableVariants[variant].cellPadding} ${tableVariants[variant].textSize} text-text-primary`,
  text: 'text-text-primary',
  secondary: 'text-text-secondary',
  muted: 'text-text-muted',
} as const;

/**
 * Table Empty State Styles
 */
export const tableEmpty = {
  container: 'flex flex-col items-center justify-center py-12 px-4 text-center',
  icon: 'w-12 h-12 text-text-disabled mb-4',
  message: 'text-text-muted text-sm',
} as const;

/**
 * Table Skeleton Styles
 */
export const tableSkeleton = {
  row: `flex items-center ${border.divider}`,
} as const;

/**
 * Card Grid Styles (for mobile card view)
 */
export const cardGrid = {
  container: 'grid gap-4 grid-cols-1 sm:grid-cols-2',
} as const;

/**
 * Helper function to get table variant classes
 */
export const getTableVariantClasses = (variant: keyof typeof tableVariants = 'default') => {
  return tableVariants[variant];
};

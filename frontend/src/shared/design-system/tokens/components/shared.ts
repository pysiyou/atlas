/**
 * Shared Components Tokens
 * 
 * Unified styling tokens for shared components (LoadingState, ErrorAlert, InfoField, etc.)
 */

import { neutralColors, brandColors, semanticColors } from '../colors';
import { fontSize, fontWeight, label } from '../typography';
import { padding, gap } from '../spacing';
import { radius, border } from '../borders';

/**
 * Loading State Styles
 */
export const loadingState = {
  container: {
    fullScreen: 'h-full flex items-center justify-center',
    inline: `flex items-center justify-center ${padding.vertical.xl}`,
  },
  spinner: `${brandColors.primary.icon} border-b-2`,
  message: `${fontSize.sm} ${neutralColors.text.tertiary}`,
  sizes: {
    sm: 'h-6 w-6 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  },
} as const;

/**
 * Inline Error Styles
 */
export const inlineError = {
  container: `${semanticColors.danger.errorText} ${fontSize.sm} flex items-center gap-2 ${padding.card.sm} ${semanticColors.danger.backgroundLight} ${radius.md}`,
  dismissButton: `${semanticColors.danger.iconLight} hover:${semanticColors.danger.icon} cursor-pointer`,
} as const;

/**
 * Info Field Styles
 */
export const infoField = {
  label: `${label.default}`,
  value: `${fontSize.sm} ${neutralColors.text.primary}`,
  icon: 'w-4 h-4 text-gray-400',
  container: {
    horizontal: 'flex items-start justify-between gap-4',
    vertical: 'space-y-1',
  },
  labelContainer: 'flex items-center gap-2 min-w-0 flex-shrink-0',
} as const;

/**
 * Section Card Styles
 */
export const sectionCard = {
  container: `${neutralColors.white} ${radius.lg} ${border.card} overflow-hidden`,
  header: `flex items-center justify-between ${padding.horizontal.lg} ${padding.vertical.md} border-b ${border.default} bg-gray-50`,
  headerCollapsible: 'cursor-pointer hover:bg-gray-100 transition-colors',
  title: `${fontSize.sm} ${fontWeight.semibold} ${neutralColors.text.primary}`,
  icon: 'w-4 h-4 text-gray-500',
  content: padding.card.md,
} as const;

/**
 * Section Grid Styles
 */
export const sectionGrid = {
  gap: {
    sm: gap.sm,
    md: gap.md,
    lg: gap.lg,
  },
  columns: {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  },
} as const;

/**
 * Filter Components Styles
 */
export const filterComponents = {
  label: `${fontSize.xs} ${fontWeight.medium} text-gray-700`,
  link: `${fontSize.xs} ${brandColors.primary.icon} hover:${brandColors.primary.textOnLight} disabled:text-gray-400 disabled:cursor-not-allowed transition-colors`,
  separator: 'text-gray-300',
  resultCount: `${fontSize.xs} ${neutralColors.text.muted}`,
  bar: {
    container: `border-b ${border.default} ${neutralColors.white}`,
    header: `flex items-center justify-between ${padding.horizontal.lg} ${padding.vertical.md} border-b border-gray-100`,
    title: `${fontSize.sm} ${fontWeight.medium} ${neutralColors.text.primary}`,
    resetButton: `${fontSize.xs} ${brandColors.primary.icon} hover:${brandColors.primary.textOnLight} ${fontWeight.medium} transition-colors cursor-pointer`,
    toggleButton: `p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer`,
    content: `${padding.card.lg} space-y-4`,
  },
} as const;

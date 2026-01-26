/**
 * Pagination Component Tokens
 *
 * Unified styling tokens for pagination components ensuring
 * consistent appearance across all paginated views.
 */

import { brandColors, neutralColors } from '../colors';
import { fontSize } from '../typography';
import { radius } from '../borders';
import { hover, focus, disabled } from '../interactions';
import { transitions } from '../animations';

/**
 * Pagination Container Styles
 */
export const paginationContainer = {
  base: 'flex items-center justify-between px-4 py-4 bg-surface border-t border-border',
  compact: 'flex items-center justify-between px-3 py-3 bg-surface border-t border-border',
} as const;

/**
 * Pagination Select Styles
 */
export const paginationSelect = {
  base: `block w-full py-1 pl-3 pr-8 ${fontSize.xs} border border-border-strong ${radius.md} cursor-pointer`,
  focus: `${focus.outline} focus:ring-brand focus:border-brand`,
  combined: `block w-full py-1 pl-3 pr-8 ${fontSize.xs} border border-border-strong ${radius.md} cursor-pointer ${focus.outline} focus:ring-brand focus:border-brand`,
} as const;

/**
 * Pagination Page Button Styles
 */
export const paginationPageButton = {
  base: `px-3 py-1 ${fontSize.xs} ${radius.md} cursor-pointer ${transitions.colors}`,
  active: `${brandColors.primary.background} text-white font-medium`,
  inactive: `${neutralColors.text.secondary} ${hover.backgroundStrong}`,
} as const;

/**
 * Pagination Navigation Button Styles
 */
export const paginationNavButton = {
  base: `p-1 ${radius.md} ${hover.backgroundStrong} ${disabled.combined} cursor-pointer flex items-center justify-center ${transitions.colors}`,
  icon: 'w-5 h-5 text-text-muted',
} as const;

/**
 * Pagination Text Styles
 */
export const paginationText = {
  label: `${fontSize.xs} ${neutralColors.text.muted} whitespace-nowrap`,
  info: `${fontSize.xs} ${neutralColors.text.muted}`,
  ellipsis: `px-2 ${neutralColors.text.muted} ${fontSize.xs}`,
} as const;

/**
 * Combined Pagination Tokens
 */
export const paginationTokens = {
  container: paginationContainer,
  select: paginationSelect,
  pageButton: paginationPageButton,
  navButton: paginationNavButton,
  text: paginationText,
} as const;

/**
 * Helper function to get page button classes
 */
export const getPageButtonClasses = (isActive: boolean): string => {
  return `${paginationPageButton.base} ${isActive ? paginationPageButton.active : paginationPageButton.inactive}`;
};

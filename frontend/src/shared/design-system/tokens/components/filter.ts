/**
 * Filter Component Tokens
 *
 * Unified styling tokens for filter bars and filter controls
 * ensuring consistent appearance across all filterable views.
 */

import { neutralColors, brandColors } from '../colors';
import { fontSize, fontWeight } from '../typography';
import { padding, gap } from '../spacing';
import { border, radius } from '../borders';
import { hover, focus, disabled } from '../interactions';
import { transitions } from '../animations';
import { filterControlSizing } from '../sizing';

/**
 * Filter Control Sizing (re-exported from sizing.ts for convenience)
 */
export const filterControl = {
  height: filterControlSizing.height,
  heightLg: filterControlSizing.heightLg,
  minWidth: filterControlSizing.minWidth,
} as const;

/**
 * Filter Container Styles
 */
export const filterContainer = {
  base: `bg-surface border-b ${border.default}`,
  row: 'flex flex-row flex-wrap items-center gap-x-3 gap-y-2 lg:gap-x-4 lg:gap-y-2',
  header: `flex items-center justify-between ${padding.horizontal.lg} ${padding.vertical.md} border-b ${neutralColors.border.default}`,
  content: `${padding.card.lg} space-y-4`,
} as const;

/**
 * Filter Input Styles
 */
export const filterInput = {
  base: `${filterControl.height} ${fontSize.xs} border ${neutralColors.border.medium} ${radius.md} ${padding.horizontal.sm} ${focus.outline} focus:${brandColors.primary.borderMedium} ${transitions.colors}`,
  withIcon: `${filterControl.height} ${fontSize.xs} border ${neutralColors.border.medium} ${radius.md} pl-9 pr-3 ${focus.outline} focus:${brandColors.primary.borderMedium} ${transitions.colors}`,
  icon: `absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${neutralColors.text.disabled}`,
  clearButton: `p-0.5 -mr-1 ${hover.background} rounded ${transitions.colors} flex items-center justify-center cursor-pointer shrink-0`,
} as const;

/**
 * Filter Select Styles
 */
export const filterSelect = {
  trigger: `${filterControl.height} ${fontSize.xs} border ${neutralColors.border.medium} ${radius.md} ${padding.horizontal.sm} bg-surface cursor-pointer ${hover.background} ${focus.outline} focus:${brandColors.primary.borderMedium} ${transitions.colors}`,
  placeholder: `${neutralColors.text.muted}`,
  value: `${neutralColors.text.primary}`,
} as const;

/**
 * Filter Button Styles
 */
export const filterButton = {
  base: `${filterControl.height} ${fontSize.xs} ${fontWeight.medium} ${radius.md} ${padding.horizontal.md} cursor-pointer ${transitions.colors}`,
  primary: `${brandColors.primary.background} text-white ${hover.backgroundPrimary}`,
  secondary: `bg-surface border ${neutralColors.border.medium} ${neutralColors.text.secondary} ${hover.background}`,
  ghost: `${neutralColors.text.tertiary} ${hover.background}`,
} as const;

/**
 * Filter Label Styles
 */
export const filterLabel = {
  base: `${fontSize.xs} ${fontWeight.medium} ${neutralColors.text.secondary}`,
  link: `${fontSize.xs} ${brandColors.primary.icon} hover:${brandColors.primary.textOnLight} ${disabled.text} ${disabled.cursor} ${transitions.colors}`,
} as const;

/**
 * Filter Badge/Tag Styles
 */
export const filterBadge = {
  container: 'flex flex-wrap items-center gap-1.5',
  item: `inline-flex items-center ${gap.xs} px-2 py-0.5 ${fontSize.xs} ${neutralColors.gray[100]} ${neutralColors.text.secondary} ${radius.md}`,
  removeButton: `${hover.text} cursor-pointer`,
} as const;

/**
 * Filter Reset/Clear Styles
 */
export const filterReset = {
  button: `${fontSize.xs} ${brandColors.primary.icon} hover:${brandColors.primary.textOnLight} ${fontWeight.medium} ${transitions.colors} cursor-pointer`,
  toggleButton: `p-1 ${neutralColors.text.disabled} hover:${neutralColors.text.tertiary} ${transitions.colors} cursor-pointer`,
} as const;

/**
 * Filter Popover/Dropdown Content Styles
 */
export const filterPopover = {
  content: 'flex flex-col py-1',
  optionsList: 'max-h-[300px] overflow-y-auto',
  separator: `border-t ${neutralColors.border.default} mt-1`,
  footer: 'px-4 py-2.5',
} as const;

/**
 * Combined Filter Tokens
 */
export const filterTokens = {
  control: filterControl,
  container: filterContainer,
  input: filterInput,
  select: filterSelect,
  button: filterButton,
  label: filterLabel,
  badge: filterBadge,
  reset: filterReset,
  popover: filterPopover,
} as const;

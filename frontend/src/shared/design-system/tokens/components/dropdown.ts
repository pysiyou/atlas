/**
 * Dropdown Component Tokens
 * 
 * Unified dropdown/popover/select menu styling tokens ensuring all dropdown
 * components (MultiSelectFilter, SingleSelectControl, DateFilter, etc.) use
 * identical styling.
 */

import { brandColors, neutralColors } from '../colors';
import { padding } from '../spacing';
import { hover } from '../interactions';
import { transitions } from '../animations';
import { radius } from '../borders';
import { filterControl } from './filter';

/**
 * Dropdown Trigger Button Styles
 * Used by: MultiSelectFilter, SingleSelectControl, DateFilter, etc.
 */
export const dropdown = {
  trigger: {
    base: `flex items-center gap-2 ${padding.horizontal.sm} py-1.5 ${filterControl.height} min-h-[34px] max-h-[34px] bg-surface border ${radius.md} rounded cursor-pointer ${transitions.colors} w-full overflow-hidden`,
    default: `border ${neutralColors.border.medium} ${hover.border}`,
    open: `${brandColors.primary.borderMedium}`,
  },
  icon: `w-4 h-4 ${neutralColors.text.disabled} shrink-0`,
  content: 'min-w-0 flex-1 text-xs truncate',
  rightIcons: 'flex items-center gap-0.5 shrink-0',
  chevron: `w-4 h-4 ${neutralColors.text.disabled} ${transitions.colors} shrink-0`,
  clearButton: `p-0.5 ${hover.background} rounded ${transitions.colors} flex items-center justify-center cursor-pointer shrink-0`,
  clearIcon: `w-4 h-4 ${neutralColors.text.disabled} hover:${neutralColors.text.tertiary}`,
  clearButtonPlaceholder: 'w-5 h-5 shrink-0',
} as const;

/**
 * Dropdown Content Container
 */
export const dropdownContent = {
  container: 'flex flex-col py-1',
  minWidth: 'min-w-[280px]',
  optionsList: 'max-h-[300px] overflow-y-auto',
} as const;

/**
 * Dropdown Item Styles
 * Individual items in the dropdown list
 */
export const dropdownItem = {
  base: `group flex items-center ${padding.horizontal.lg} py-2.5 cursor-pointer ${transitions.colors}`,
  hover: `${hover.background}`,
  selected: `bg-brand-light/30`,
  checkbox: {
    container: 'shrink-0 mr-3',
    unchecked: `w-5 h-5 rounded-md border-2 ${neutralColors.border.medium} group-hover:${neutralColors.border.strong} ${transitions.colors}`,
    checked: `w-5 h-5 rounded-md flex items-center justify-center ${brandColors.primary.backgroundMedium} ${transitions.colors}`,
    radio: {
      unchecked: `w-5 h-5 rounded-full border-2 ${neutralColors.border.medium} group-hover:${neutralColors.border.strong} ${transitions.colors}`,
      checked: `w-5 h-5 rounded-full flex items-center justify-center border-2 ${brandColors.primary.borderMedium} ${brandColors.primary.backgroundMedium}`,
      inner: 'w-2 h-2 rounded-full bg-surface',
    },
    icon: 'w-3.5 h-3.5 text-white',
  },
  label: `text-sm ${neutralColors.text.tertiary} group-hover:${neutralColors.text.primary} ${transitions.colors}`,
} as const;

/**
 * Dropdown Separator
 */
export const dropdownSeparator = {
  base: `border-t ${neutralColors.border.default} mt-1`,
} as const;

/**
 * Dropdown Footer Styles
 * For "Select all" and "Clear" actions
 */
export const dropdownFooter = {
  container: `${padding.horizontal.lg} py-2.5`,
  selectAll: {
    container: 'flex items-center w-full cursor-pointer group',
    checkbox: dropdownItem.checkbox,
    label: `text-sm ${neutralColors.text.tertiary} group-hover:${neutralColors.text.primary} ${transitions.colors}`,
  },
  clearButton: {
    base: `w-full ${padding.horizontal.lg} py-2.5 text-left text-sm ${neutralColors.text.tertiary} hover:${neutralColors.text.primary} ${hover.background} ${transitions.colors} flex items-center gap-2`,
    icon: `w-4 h-4 ${neutralColors.text.disabled}`,
  },
} as const;

/**
 * Combined Dropdown Tokens
 */
export const dropdownTokens = {
  trigger: dropdown.trigger,
  content: dropdownContent,
  item: dropdownItem,
  separator: dropdownSeparator,
  footer: dropdownFooter,
} as const;

/**
 * Tabs Component Tokens
 * 
 * Unified tabs styling tokens ensuring consistent tab appearance.
 */

import { brandColors, neutralColors } from '../colors';
import { padding } from '../spacing';
import { radius } from '../borders';
import { fontSize, fontWeight } from '../typography';

/**
 * Tabs Base Styles
 */
export const tabsBase = {
  container: 'relative flex items-center overflow-x-auto no-scrollbar',
  underline: 'h-full min-h-full',
  pills: 'gap-2',
} as const;

/**
 * Tab Button Styles - Underline Variant
 */
export const tabButtonUnderline = {
  base: 'whitespace-nowrap flex items-center justify-center transition-all duration-200 font-medium text-xs cursor-pointer',
  padding: `${padding.horizontal.md} ${padding.vertical.sm}`,
  active: 'text-sky-600', // Uses brandColors.primary.icon equivalent
  inactive: 'text-gray-500 hover:text-gray-700', // Uses neutralColors.text.muted and hover
} as const;

/**
 * Tab Button Styles - Pills Variant
 */
export const tabButtonPills = {
  base: 'whitespace-nowrap flex items-center justify-center transition-all duration-200 font-medium text-xs cursor-pointer',
  padding: `${padding.horizontal.md} ${padding.vertical.xs} ${radius.md}`,
  active: `${brandColors.primary.backgroundLight} text-sky-700`, // bg-sky-100 text-sky-700
  inactive: 'bg-transparent text-gray-600 hover:bg-gray-100', // Uses neutralColors
} as const;

/**
 * Tab Indicator Styles
 */
export const tabIndicator = {
  base: 'absolute bottom-0 left-0 h-[2px] rounded-full pointer-events-none z-10',
  color: `${brandColors.primary.background}`, // bg-sky-600
  transition: 'left 320ms cubic-bezier(0.32, 0.72, 0, 1), width 320ms cubic-bezier(0.32, 0.72, 0, 1)',
} as const;

/**
 * Tab Count Badge Styles
 */
export const tabCountBadge = {
  base: `ml-2 ${fontSize.xs} ${padding.vertical.xs} ${padding.horizontal.sm} ${radius.full}`,
  underline: {
    active: `${brandColors.primary.backgroundLight} ${brandColors.primary.icon}`, // bg-sky-100 text-sky-600
    inactive: 'bg-gray-100 text-gray-500', // Uses neutralColors
  },
  pills: {
    active: 'bg-sky-200 text-sky-800', // Uses brandColors.primary variants
    inactive: 'bg-gray-100 text-gray-500', // Uses neutralColors
  },
} as const;

/**
 * Helper function to get tab button classes
 */
export const getTabButtonClasses = (
  variant: 'underline' | 'pills',
  isActive: boolean
): string => {
  const base = variant === 'underline' ? tabButtonUnderline.base : tabButtonPills.base;
  const padding = variant === 'underline' ? tabButtonUnderline.padding : tabButtonPills.padding;
  const state = variant === 'underline'
    ? (isActive ? tabButtonUnderline.active : tabButtonUnderline.inactive)
    : (isActive ? tabButtonPills.active : tabButtonPills.inactive);
  
  return `${base} ${padding} ${state}`;
};

/**
 * Helper function to get tab count badge classes
 */
export const getTabCountBadgeClasses = (
  variant: 'underline' | 'pills',
  isActive: boolean
): string => {
  const base = tabCountBadge.base;
  const state = variant === 'underline'
    ? (isActive ? tabCountBadge.underline.active : tabCountBadge.underline.inactive)
    : (isActive ? tabCountBadge.pills.active : tabCountBadge.pills.inactive);
  
  return `${base} ${state}`;
};

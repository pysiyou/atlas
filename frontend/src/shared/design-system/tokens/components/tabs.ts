/**
 * Tabs Component Tokens
 * 
 * Unified tabs styling tokens ensuring consistent tab appearance.
 */

import { brandColors } from '../colors';
import { padding } from '../spacing';
import { radius } from '../borders';
import { fontSize } from '../typography';

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
  active: 'text-brand', // Uses brandColors.primary.icon equivalent
  inactive: 'text-text-muted hover:text-text-secondary', // Uses neutralColors.text.muted and hover
} as const;

/**
 * Tab Button Styles - Pills Variant
 */
export const tabButtonPills = {
  base: 'whitespace-nowrap flex items-center justify-center transition-all duration-200 font-medium text-xs cursor-pointer',
  padding: `${padding.horizontal.md} ${padding.vertical.xs} ${radius.md}`,
  active: `${brandColors.primary.backgroundLight} text-brand-hover`, // bg-brand-light text-brand-hover
  inactive: 'bg-transparent text-text-tertiary hover:bg-neutral-100', // Uses neutralColors
} as const;

/**
 * Tab Indicator Styles
 */
export const tabIndicator = {
  base: 'absolute bottom-0 left-0 h-[2px] rounded-full pointer-events-none z-10',
  color: `${brandColors.primary.background}`, // bg-brand
  transition: 'left 320ms cubic-bezier(0.32, 0.72, 0, 1), width 320ms cubic-bezier(0.32, 0.72, 0, 1)',
} as const;

/**
 * Tab Count Badge Styles
 */
export const tabCountBadge = {
  base: `ml-2 ${fontSize.xs} ${padding.vertical.xs} ${padding.horizontal.sm} ${radius.full}`,
  underline: {
    active: `${brandColors.primary.backgroundLight} ${brandColors.primary.icon}`, // bg-brand-light text-brand
    inactive: 'bg-neutral-100 text-text-muted', // Uses neutralColors
  },
  pills: {
    active: 'bg-brand-light text-brand-text', // Uses brandColors.primary variants
    inactive: 'bg-neutral-100 text-text-muted', // Uses neutralColors
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

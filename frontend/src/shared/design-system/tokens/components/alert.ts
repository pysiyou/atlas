/**
 * Alert Component Tokens
 * 
 * Alert styling tokens that MUST match Badge semantic colors exactly.
 * Ensures visual consistency between Alert and Badge components.
 */

import { semanticColors } from '../colors';
import { padding } from '../spacing';
import { radius, border } from '../borders';
import { gap } from '../spacing';

/**
 * Alert Base Styles
 */
export const alertBase = {
  base: 'border rounded flex items-start',
  padding: padding.card.md, // p-4
  gap: gap.sm, // gap-3
} as const;

/**
 * Alert Variants
 * MUST use EXACT same semantic colors as Badge component
 */
export const alertVariants = {
  success: {
    bg: semanticColors.success.backgroundLight, // bg-green-100
    border: semanticColors.success.border,      // border-green-200
    text: semanticColors.success.textLight,     // text-green-800
  },
  danger: {
    bg: semanticColors.danger.backgroundLight,  // bg-red-100
    border: semanticColors.danger.border,       // border-red-200
    text: semanticColors.danger.textLight,     // text-red-800
  },
  warning: {
    bg: semanticColors.warning.backgroundLight, // bg-yellow-100
    border: semanticColors.warning.border,       // border-yellow-200
    text: semanticColors.warning.textLight,      // text-yellow-800
  },
  info: {
    bg: semanticColors.info.backgroundLight,    // bg-sky-100
    border: semanticColors.info.border,         // border-sky-200
    text: semanticColors.info.textLight,        // text-sky-800
  },
} as const;

/**
 * Helper function to get alert variant classes
 */
export const getAlertVariant = (variant: keyof typeof alertVariants): string => {
  const variantStyles = alertVariants[variant];
  return `${variantStyles.bg} ${variantStyles.border} ${variantStyles.text}`;
};

/**
 * Helper function to get complete alert classes
 */
export const getAlertClasses = (variant: keyof typeof alertVariants): string => {
  return `${alertBase.base} ${getAlertVariant(variant)} ${alertBase.padding} ${alertBase.gap}`;
};

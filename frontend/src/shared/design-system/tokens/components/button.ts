/**
 * Button Component Tokens
 * 
 * Unified button styling tokens ensuring Button.tsx and IconButton.tsx
 * use identical styles for the same variants.
 */

import { semanticColors, brandColors } from '../colors';
import { padding } from '../spacing';
import { radius } from '../borders';

/**
 * Button Base Styles
 * Applied to all button variants
 */
export const buttonBase = {
  base: 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  rounded: radius.button,
} as const;

/**
 * Button Variants
 * MUST be identical between Button.tsx and IconButton.tsx
 */
export const buttonVariants = {
  primary: {
    base: `${brandColors.primary.background} ${brandColors.primary.text} ${brandColors.primary.backgroundHover} ${brandColors.primary.focusRing} focus:ring-offset-2`,
  },
  
  secondary: {
    base: `${brandColors.secondary.background} ${brandColors.secondary.text} ${brandColors.secondary.backgroundHover} ${brandColors.secondary.focusRing} focus:ring-offset-2`,
  },
  
  danger: {
    base: `${semanticColors.danger.background} ${semanticColors.danger.text} ${semanticColors.danger.backgroundHover} ${semanticColors.danger.focusRing} focus:ring-offset-2`,
  },
  
  success: {
    base: `${semanticColors.success.background} ${semanticColors.success.text} ${semanticColors.success.backgroundHover} ${semanticColors.success.focusRing} focus:ring-offset-2`,
  },
  
  warning: {
    base: `${semanticColors.warning.background} ${semanticColors.warning.text} ${semanticColors.warning.backgroundHover} ${semanticColors.warning.focusRing} focus:ring-offset-2`,
  },
  
  outline: {
    base: 'border-2 border-border-strong bg-transparent text-text-secondary hover:bg-surface-hover focus:ring-neutral-500 focus:ring-offset-2',
  },
  
  ghost: {
    base: 'bg-transparent text-text-secondary hover:bg-surface-hover focus:ring-neutral-500 focus:ring-offset-2',
  },
} as const;

/**
 * Button Sizes
 * MUST be identical between Button.tsx and IconButton.tsx
 */
export const buttonSizes = {
  xs: {
    padding: padding.button.xs,
    text: 'text-xs',
  },
  sm: {
    padding: padding.button.sm,
    text: 'text-xs',
  },
  md: {
    padding: padding.button.md,
    text: 'text-sm',
  },
  lg: {
    padding: padding.button.lg,
    text: 'text-base',
  },
} as const;

/**
 * IconButton Specific Variants
 * These are additional variants for IconButton that Button doesn't have
 */
export const iconButtonVariants = {
  approve: {
    base: `${semanticColors.success.background} ${semanticColors.success.text} ${semanticColors.success.backgroundHover} ${semanticColors.success.focusRing} focus:ring-offset-2`,
  },
  
  delete: {
    base: `${semanticColors.danger.background} ${semanticColors.danger.text} ${semanticColors.danger.backgroundHover} ${semanticColors.danger.focusRing} focus:ring-offset-2`,
  },
  
  edit: {
    base: 'bg-brand text-text-inverse hover:bg-brand-hover focus:ring-brand focus:ring-offset-2',
  },
  
  view: {
    base: 'bg-neutral-200 text-text-primary hover:bg-neutral-300 focus:ring-neutral-500 focus:ring-offset-2',
  },
  
  print: {
    base: 'bg-neutral-200 text-text-primary hover:bg-neutral-300 focus:ring-neutral-500 focus:ring-offset-2',
  },
  
  add: {
    base: `${brandColors.primary.background} ${brandColors.primary.text} ${brandColors.primary.backgroundHover} ${brandColors.primary.focusRing} focus:ring-offset-2`,
  },
} as const;

/**
 * Helper function to get button variant classes
 */
export const getButtonVariant = (variant: keyof typeof buttonVariants): string => {
  return buttonVariants[variant].base;
};

/**
 * Helper function to get button size classes
 */
export const getButtonSize = (size: keyof typeof buttonSizes): string => {
  return `${buttonSizes[size].padding} ${buttonSizes[size].text}`;
};

/**
 * Helper function to get complete button classes
 */
export const getButtonClasses = (
  variant: keyof typeof buttonVariants,
  size: keyof typeof buttonSizes = 'md'
): string => {
  return `${buttonBase.base} ${getButtonVariant(variant)} ${getButtonSize(size)} ${buttonBase.rounded}`;
};

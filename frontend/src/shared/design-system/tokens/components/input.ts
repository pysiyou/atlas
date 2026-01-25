/**
 * Input Component Tokens
 * 
 * Unified input styling tokens ensuring all input components
 * (Input, Textarea, Select, DateInput, TagInput, SearchBar) use identical styles.
 */

import { semanticColors } from '../colors';
import { padding } from '../spacing';
import { radius, border } from '../borders';

/**
 * Input Base Styles
 * Applied to all input types
 */
export const inputBase = {
  base: 'block w-full bg-white transition-shadow duration-200 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed',
  rounded: radius.input,
} as const;

/**
 * Input Padding
 * Consistent padding for all input types
 */
export const inputPadding = {
  default: padding.input.base, // px-3 py-2.5
  withIcon: padding.input.withIcon, // pl-10 pr-3 py-2.5
  withIconRight: padding.input.withIconRight, // pl-3 pr-10 py-2.5
  sm: padding.input.sm, // px-2 py-1.5
  md: padding.input.md, // px-3 py-2.5
  lg: padding.input.lg, // px-4 py-3
} as const;

/**
 * Input Border States
 */
export const inputBorder = {
  default: border.input, // border border-gray-300
  focus: border.inputFocus, // border-2 border-sky-500 border-transparent
  error: border.inputError, // border border-red-500
  disabled: 'border border-gray-300',
} as const;

/**
 * Input Text Styles
 */
export const inputText = {
  default: 'text-xs placeholder:text-gray-300',
  sm: 'text-xs placeholder:text-gray-300',
  md: 'text-sm placeholder:text-gray-300',
  lg: 'text-base placeholder:text-gray-300',
} as const;

/**
 * Input Focus Ring
 */
export const inputFocus = {
  default: `focus:ring-2 ${semanticColors.info.focusRing} focus:ring-sky-500/20 focus:border-sky-500`,
  error: `focus:ring-2 ${semanticColors.danger.focusRing} focus:ring-red-500/20 focus:border-red-500`,
} as const;

/**
 * Label Styles
 * Consistent label styling across all forms
 */
export const label = {
  base: 'block text-xs font-medium text-gray-500 mb-1',
  sm: 'text-xxs font-medium text-gray-500',
  required: 'block text-xs font-medium text-gray-500 mb-1',
  error: 'block text-xs font-medium text-red-600 mb-1',
} as const;

/**
 * Error Message Styles
 * Consistent error message styling
 */
export const errorMessage = {
  base: 'mt-1 text-sm text-red-600',
  small: 'mt-1 text-xs text-red-600',
} as const;

/**
 * Required Indicator
 */
export const requiredIndicator = {
  base: 'text-red-500 ml-1',
} as const;

/**
 * Helper Text Styles
 */
export const helperText = {
  base: 'mt-1 text-xs text-gray-500',
  error: 'mt-1 text-xs text-red-600',
} as const;

/**
 * Input Container Styles
 * For wrapping input with label and error
 */
export const inputContainer = {
  base: 'w-full',
} as const;

/**
 * Helper function to get input classes
 */
export const getInputClasses = (
  hasError: boolean = false,
  hasIcon: boolean = false,
  iconPosition: 'left' | 'right' = 'left',
  size: 'sm' | 'md' | 'lg' = 'md',
  disabled: boolean = false
): string => {
  const paddingClass = hasIcon
    ? iconPosition === 'left'
      ? inputPadding.withIcon
      : inputPadding.withIconRight
    : inputPadding[size];
  
  const borderClass = hasError
    ? inputBorder.error
    : disabled
    ? inputBorder.disabled
    : inputBorder.default;
  
  const focusClass = hasError ? inputFocus.error : inputFocus.default;
  const textClass = inputText[size];
  
  return `${inputBase.base} ${paddingClass} ${borderClass} ${textClass} ${focusClass} ${inputBase.rounded}`;
};

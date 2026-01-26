/**
 * Modal Component Tokens
 * 
 * Unified modal styling tokens ensuring consistent modal appearance.
 */

import { neutralColors } from '../colors';
import { padding } from '../spacing';
import { radius, border } from '../borders';
import { shadow } from '../shadows';
import { heading, fontSize } from '../typography';

/**
 * Modal Base Styles
 */
export const modalBase = {
  container: 'fixed inset-0 z-50 flex items-start justify-center lg:justify-end',
  backdrop: 'fixed inset-0',
  dialog: `${neutralColors.white} ${border.card} ${shadow.modal} ${radius.modal} w-full flex flex-col origin-top lg:origin-top-right relative`,
} as const;

/**
 * Modal Sizes
 */
export const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
} as const;

/**
 * Modal Padding
 */
export const modalPadding = {
  container: 'p-2 md:p-6',
  header: `${padding.horizontal.lg} ${padding.vertical.md}`,
  content: 'grow overflow-hidden relative flex flex-col min-h-0',
} as const;

/**
 * Modal Header Styles
 */
export const modalHeader = {
  container: `${modalPadding.header} ${border.divider} ${neutralColors.white} flex items-center justify-between shrink-0`,
  titleContainer: 'flex items-start gap-3 min-w-0',
  title: `${heading.h2} truncate`,
  subtitle: `${fontSize.sm} text-text-tertiary mt-0.5`,
  actions: 'flex gap-2 shrink-0',
} as const;

/**
 * Modal Height
 */
export const modalHeight = {
  mobile: 'h-[calc(100vh-16px)]',
  desktop: 'md:h-[calc(100vh-48px)]',
} as const;

/**
 * Helper function to get modal classes
 */
export const getModalClasses = (size?: keyof typeof modalSizes): string => {
  const sizeClass = size ? modalSizes[size] : '';
  return `${modalBase.dialog} ${sizeClass} ${modalHeight.mobile} ${modalHeight.desktop}`;
};

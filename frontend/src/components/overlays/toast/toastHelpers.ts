/**
 * toastHelpers.ts — Variant styles, icons, and defaults for Toast.
 */

import { getColorStyles } from '@/components/primitives/badgeHelpers';
import type { BadgeColor } from '@/components/primitives/badgeHelpers';
import type { IconName } from '@/components/primitives/Icon';
import { getBadgeAppearance } from '@/components/theme/theme';
import type { ToastVariant } from './toastTypes';

export const TOAST_DEFAULT_DURATION_MS = 4000;

export const DEFAULT_TOAST_TITLES: Record<ToastVariant, string> = {
  success: 'Success',
  error: 'Error',
  info: 'Informational',
  warning: 'Warning',
  loading: 'Loading',
};

const TOAST_BADGE_COLOR: Record<ToastVariant, BadgeColor> = {
  success: 'success',
  error: 'danger',
  info: 'info',
  warning: 'warning',
  loading: 'neutral',
};

/** Neutral shell — title/subtitle own typography; variant color lives on the icon. */
const UNIFIED_TOAST_SURFACE = 'bg-badge border border-border-default shadow-sm';

const TINTED_TOAST_SURFACE: Record<ToastVariant, string> = {
  success: 'bg-success-bg-emphasis border border-border-default shadow-sm',
  error: 'bg-danger-bg-emphasis border border-border-default shadow-sm',
  info: 'bg-brand-muted border border-border-default shadow-sm',
  warning: 'bg-warning-bg-emphasis border border-border-default shadow-sm',
  loading: 'bg-neutral-200 border border-border-default shadow-sm',
};

/** Toast container — badge shell without variant text color. */
export function getToastSurfaceClasses(variant: ToastVariant): string {
  if (getBadgeAppearance() === 'tinted') {
    return TINTED_TOAST_SURFACE[variant];
  }
  return UNIFIED_TOAST_SURFACE;
}

/** Semantic accent for the toast icon only. */
export function getToastIconClasses(variant: ToastVariant): string {
  const { className } = getColorStyles(TOAST_BADGE_COLOR[variant], 'unified');
  return className;
}

export const TOAST_ICON_NAME: Record<ToastVariant, IconName | null> = {
  success: 'check-circle',
  error: 'close-circle',
  info: 'info-circle',
  warning: 'warning',
  loading: null,
};

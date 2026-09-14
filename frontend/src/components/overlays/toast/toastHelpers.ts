/**
 * toastHelpers.ts — Variant styles, icons, and defaults for Toast.
 */

import type { IconName } from '@/components/primitives/Icon';
import type { ToastVariant } from './toastTypes';

export const TOAST_DEFAULT_DURATION_MS = 4000;

export const DEFAULT_TOAST_TITLES: Record<ToastVariant, string> = {
  success: 'Success',
  error: 'Error',
  info: 'Informational',
  warning: 'Warning',
  loading: 'Loading',
};

const TOAST_SURFACE: Record<ToastVariant, string> = {
  success: 'toast-card toast-card--success',
  error: 'toast-card toast-card--error',
  info: 'toast-card toast-card--info',
  warning: 'toast-card toast-card--warning',
  loading: 'toast-card toast-card--loading',
};

const TOAST_ICON_CLASS: Record<ToastVariant, string> = {
  success: 'text-toast-success',
  error: 'text-toast-danger',
  info: 'text-toast-info',
  warning: 'text-toast-warning',
  loading: 'text-toast-fg-muted',
};

/** Toast container — theme tokens + per-variant accent gradient. */
export function getToastSurfaceClasses(variant: ToastVariant): string {
  return TOAST_SURFACE[variant];
}

/** Semantic accent for the toast icon only. */
export function getToastIconClasses(variant: ToastVariant): string {
  return TOAST_ICON_CLASS[variant];
}

export const TOAST_ICON_NAME: Record<ToastVariant, IconName | null> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info-circle',
  warning: 'warning',
  loading: null,
};

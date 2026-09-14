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

export const TOAST_ACCENT: Record<ToastVariant, string> = {
  success: 'var(--toast-success)',
  error: 'var(--toast-danger)',
  info: 'var(--toast-info)',
  warning: 'var(--toast-warning)',
  loading: 'var(--toast-fg-muted)',
};

export const TOAST_ICON_NAME: Record<ToastVariant, IconName | null> = {
  success: 'check-circle',
  error: 'close-circle',
  info: 'info-circle',
  warning: 'warning',
  loading: null,
};

export const TOAST_ICON_CLASS: Record<ToastVariant, string> = {
  success: 'text-(--toast-success)',
  error: 'text-(--toast-danger)',
  info: 'text-(--toast-info)',
  warning: 'text-(--toast-warning)',
  loading: 'text-(--toast-fg-muted)',
};

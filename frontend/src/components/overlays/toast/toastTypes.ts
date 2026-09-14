/**
 * toastTypes.ts — Shared types for the Toast family.
 */

import type { HTMLAttributes, ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  /** Primary heading shown in the toast. */
  title: string;
  /** Optional supporting copy under the title. */
  subtitle?: string;
  /** Optional action chips (e.g. Undo). */
  actions?: ToastAction[];
  /** Called when the toast should close (timer, close button). */
  onDismiss?: () => void;
  /** When true, the toast stays until dismissed. */
  persist?: boolean;
  /** Auto-dismiss duration in ms when not persisted. */
  durationMs?: number;
  /** Show the countdown footer with pause-on-click. */
  showCountdown?: boolean;
  /** Override the variant icon. */
  customIcon?: ReactNode;
  className?: string;
  /** Accessibility props forwarded from the toaster host. */
  ariaProps?: HTMLAttributes<HTMLDivElement>;
}

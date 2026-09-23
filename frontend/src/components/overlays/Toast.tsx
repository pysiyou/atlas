/**
 * Toast.tsx — Lightweight toast card (title, subtitle, optional actions, dismiss).
 * The react-hot-toast adapter and `toast` API live in `@/app/AppToastBar`.
 */
/* eslint-disable react-refresh/only-export-components -- single module: Toast + variant tokens */

import React, { type HTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/primitives/Icon';
import { RADIUS } from '@/components/theme/recipes';
import { cn } from '@/utils';

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
  /** Called when the user dismisses the toast. */
  onDismiss?: () => void;
  /** Override the variant icon. */
  customIcon?: ReactNode;
  className?: string;
  /** Accessibility props forwarded from the toaster host. */
  ariaProps?: HTMLAttributes<HTMLDivElement>;
}

export interface BaseToastProps extends ToastProps {
  variant: ToastVariant;
}

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
function getToastSurfaceClasses(variant: ToastVariant): string {
  return TOAST_SURFACE[variant];
}

/** Semantic accent for the toast icon only. */
function getToastIconClasses(variant: ToastVariant): string {
  return TOAST_ICON_CLASS[variant];
}

export const TOAST_ICON_NAME: Record<ToastVariant, IconName | null> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info-circle',
  warning: 'warning',
  loading: null,
};

function ToastIcon({
  variant,
  customIcon,
}: {
  variant: ToastVariant;
  customIcon?: React.ReactNode;
}) {
  const accentClass = getToastIconClasses(variant);

  if (customIcon !== undefined) {
    return (
      <span className={cn('mt-space-0-5 shrink-0 w-5 h-5 flex items-center justify-center', accentClass)}>
        {customIcon}
      </span>
    );
  }

  if (variant === 'loading') {
    return (
      <span
        className={cn(
          `mt-space-0-5 shrink-0 w-5 h-5 ${RADIUS.pill} border-2 animate-spin`,
          'border-current/30 border-t-current',
          accentClass
        )}
        role="img"
        aria-hidden
      />
    );
  }

  const iconName = TOAST_ICON_NAME[variant];
  if (!iconName) return null;

  return <Icon name={iconName} className={cn('mt-space-0-5 shrink-0 w-5 h-5', accentClass)} />;
}

function ActionChip({ action }: { action: ToastAction }) {
  return (
    <button
      type="button"
      className={`mt-space-2 inline-flex items-center ${RADIUS.surface} border border-toast-action-border px-space-2-5 py-space-0-5 text-sm text-toast-fg hover:bg-toast-action-hover cursor-pointer`}
      onClick={event => {
        event.stopPropagation();
        action.onClick();
      }}
    >
      {action.label}
    </button>
  );
}

export const Toast: React.FC<BaseToastProps> = React.memo(
  ({ variant, title, subtitle, actions, onDismiss, customIcon, className = '', ariaProps }) => {
    const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';

    return (
      <div
        className={cn(
          `flex w-[380px] max-w-[calc(100vw-2rem)] items-start gap-space-3 ${RADIUS.notice} p-panel`,
          'pointer-events-auto font-sans',
          getToastSurfaceClasses(variant),
          className
        )}
        {...ariaProps}
        role={role}
      >
        <ToastIcon variant={variant} customIcon={customIcon} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-sm font-semibold leading-snug text-toast-fg">{title}</p>
          {subtitle ? (
            <p className="mt-space-1 mb-0 text-sm leading-snug text-toast-fg-muted">{subtitle}</p>
          ) : null}
          {actions?.map(action => (
            <ActionChip key={action.label} action={action} />
          ))}
        </div>
        {onDismiss ? (
          <button
            type="button"
            aria-label="Dismiss"
            className={`shrink-0 self-start -mr-space-1 -mt-space-0-5 flex h-7 w-7 items-center justify-center ${RADIUS.surface} border-0 bg-transparent p-0 text-toast-close hover:text-toast-fg-muted cursor-pointer`}
            onClick={event => {
              event.stopPropagation();
              onDismiss();
            }}
          >
            <Icon name="cross" className="w-4 h-4 pointer-events-none" />
          </button>
        ) : null}
      </div>
    );
  }
);

Toast.displayName = 'Toast';

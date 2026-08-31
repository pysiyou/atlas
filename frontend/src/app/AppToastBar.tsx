/**
 * Toast – single file: bar component + typed toast API.
 * One toast at a time (new replaces existing). Bar: icon + one-line message + close.
 */

import React from 'react';
import toastLib, { resolveValue, type Toast } from 'react-hot-toast';

type ToastMessage = Parameters<typeof toastLib>[0] | ToastMessageObject;

/** Dismiss all toasts so only one is active; new toast replaces existing. */
function dismissThen<A extends unknown[], R extends string>(fn: (...args: A) => R): (...args: A) => R {
  return ((...args: A) => {
    toastLib.dismiss();
    return fn(...args);
  }) as (...args: A) => R;
}

/** Typed toast API: one toast at a time; message can be string or ToastMessageObject. */
// eslint-disable-next-line react-refresh/only-export-components -- single file for toast API + component
export const toast = Object.assign(
  dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib>[1]) =>
    toastLib(msg as Parameters<typeof toastLib>[0], opts)
  ),
  {
  success: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib.success>[1]) =>
    toastLib.success(msg as Parameters<typeof toastLib.success>[0], opts)
  ),
  error: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib.error>[1]) =>
    toastLib.error(msg as Parameters<typeof toastLib.error>[0], opts)
  ),
  loading: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib.loading>[1]) =>
    toastLib.loading(msg as Parameters<typeof toastLib.loading>[0], opts)
  ),
  custom: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib.custom>[1]) =>
    toastLib.custom(msg as Parameters<typeof toastLib.custom>[0], opts)
  ),
  dismiss: toastLib.dismiss,
  promise: toastLib.promise,
  remove: toastLib.remove,
});

export interface ToastMessageObject {
  title?: string;
  subtitle?: string;
  actions?: { label: string; onClick: () => void }[];
  variant?: 'info' | 'warning';
}

function isToastMessageObject(m: unknown): m is ToastMessageObject {
  if (typeof m !== 'object' || m === null) return false;
  const o = m as Record<string, unknown>;
  return (
    typeof o.title === 'string' ||
    typeof o.subtitle === 'string' ||
    Array.isArray(o.actions) ||
    o.variant === 'info' ||
    o.variant === 'warning'
  );
}

type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'loading';

const DEFAULT_TITLES: Record<ToastVariant, string> = {
  success: 'Success',
  error: 'Error',
  info: 'Informational',
  warning: 'Warning',
  loading: 'Loading',
};

function getEffectiveVariant(toast: Toast, raw: unknown): ToastVariant {
  if (isToastMessageObject(raw) && raw.variant === 'info') return 'info';
  if (isToastMessageObject(raw) && raw.variant === 'warning') return 'warning';
  if (toast.type === 'success') return 'success';
  if (toast.type === 'error') return 'error';
  if (toast.type === 'loading') return 'loading';
  return 'success';
}

const VARIANT_BORDER: Record<ToastVariant, string> = {
  success: 'border-l-(--toast-success)',
  error: 'border-l-(--toast-danger)',
  info: 'border-l-(--toast-info)',
  warning: 'border-l-(--toast-warning)',
  loading: 'border-l-(--toast-fg-muted)',
};

const VARIANT_ICON_COLOR: Record<ToastVariant, string> = {
  success: 'text-(--toast-success)',
  error: 'text-(--toast-danger)',
  info: 'text-(--toast-info)',
  warning: 'text-(--toast-warning)',
  loading: 'text-(--toast-fg-muted)',
};

function ToastIcon({ variant, customIcon }: { variant: ToastVariant; customIcon?: React.ReactNode }) {
  if (customIcon !== undefined) {
    return <span className="shrink-0 w-6 h-6 flex items-center justify-center">{customIcon}</span>;
  }
  if (variant === 'loading') {
    return (
      <span
        className={`shrink-0 w-6 h-6 rounded-full border-2 border-(--toast-fg-muted) border-t-(--toast-fg) animate-spin ${VARIANT_ICON_COLOR[variant]}`}
        role="img"
        aria-hidden
      />
    );
  }
  const colorClass = VARIANT_ICON_COLOR[variant];
  if (variant === 'success') {
    return (
      <span className={`shrink-0 w-6 h-6 flex items-center justify-center ${colorClass}`} role="img" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (variant === 'error') {
    return (
      <span className={`shrink-0 w-6 h-6 flex items-center justify-center ${colorClass}`} role="img" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <circle cx="12" cy="12" r="10" />
          <path d="M14.5 9.5L9.5 14.5M9.5 9.5l5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (variant === 'info') {
    return (
      <span className={`shrink-0 w-6 h-6 flex items-center justify-center ${colorClass}`} role="img" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (variant === 'warning') {
    return (
      <span className={`shrink-0 w-6 h-6 flex items-center justify-center ${colorClass}`} role="img" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
      </span>
    );
  }
  return null;
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="w-6 h-6 pointer-events-none"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M14.5 9.5L9.5 14.5M9.5 9.5l5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface AppToastBarProps {
  toast: Toast;
}

export const AppToastBar: React.FC<AppToastBarProps> = ({ toast }) => {
  const raw = resolveValue(toast.message, toast);
  const variant = getEffectiveVariant(toast, raw);
  const isObj = isToastMessageObject(raw);
  const resolvedTitle = isObj
    ? (raw.title?.trim() || DEFAULT_TITLES[variant])
    : String(raw ?? DEFAULT_TITLES[variant]);

  return (
    <div
      className={`
        flex items-center gap-3 max-w-[320px] p-3 rounded-lg shadow-lg
        bg-(--toast-bg) text-(--toast-fg) leading-snug font-sans pointer-events-auto
        border-l-4 ${VARIANT_BORDER[variant]}
      `}
      {...toast.ariaProps}
    >
      <ToastIcon variant={variant} customIcon={toast.icon} />
      <p className="flex-1 min-w-0 text-sm font-normal text-(--toast-fg) truncate m-0">{resolvedTitle}</p>
      <button
        type="button"
        aria-label="Dismiss"
        className="shrink-0 w-6 h-6 flex items-center justify-center p-0 rounded-md text-(--toast-close) hover:text-(--toast-fg) hover:bg-white/10 cursor-pointer border-0 bg-transparent relative z-10"
        onClick={(e) => {
          e.stopPropagation();
          toastLib.dismiss(toast.id, toast.toasterId);
        }}
      >
        <CloseIcon />
      </button>
    </div>
  );
};

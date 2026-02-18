/**
 * Toast – single file: bar component + typed toast API.
 * Bar: status icon, title, close; optional subtitle and actions. Theme via --toast-* CSS vars.
 */

import React from 'react';
import toastLib from 'react-hot-toast';
import { resolveValue, type Toast } from 'react-hot-toast';

type ToastMessage = React.ReactElement | string | null | ToastMessageObject;

/** Typed toast API: message can be string or ToastMessageObject. */
// eslint-disable-next-line react-refresh/only-export-components -- single file for toast API + component
export const toast = toastLib as Omit<
  typeof toastLib,
  'success' | 'error' | 'loading' | 'custom'
> & {
  (message: ToastMessage, opts?: Parameters<typeof toastLib>[1]): string;
  success(message: ToastMessage, opts?: Parameters<typeof toastLib.success>[1]): string;
  error(message: ToastMessage, opts?: Parameters<typeof toastLib.error>[1]): string;
  loading(message: ToastMessage, opts?: Parameters<typeof toastLib.loading>[1]): string;
  custom(message: ToastMessage, opts?: Parameters<typeof toastLib.custom>[1]): string;
};

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
  const subtitle = isObj ? raw.subtitle : undefined;
  const actions = isObj ? raw.actions : undefined;

  return (
    <div
      className={`
        flex flex-col items-stretch min-w-[320px] max-w-[380px] p-3.5 rounded-xl shadow-lg
        bg-(--toast-bg) text-(--toast-fg) leading-snug font-sans pointer-events-auto
        border-l-4 ${VARIANT_BORDER[variant]}
      `}
      {...toast.ariaProps}
    >
      <div className="flex items-center gap-3">
        <ToastIcon variant={variant} customIcon={toast.icon} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-normal text-(--toast-fg) whitespace-pre-line m-0">{resolvedTitle}</p>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          className="shrink-0 w-6 h-6 flex items-center justify-center p-0 rounded-md text-(--toast-close) hover:text-(--toast-fg) hover:bg-white/10 cursor-pointer border-0 bg-transparent relative z-10"
          onClick={(e) => {
            e.stopPropagation();
            toastLib.dismiss(toast.id);
          }}
        >
          <CloseIcon />
        </button>
      </div>
      {subtitle != null && subtitle !== '' && (
        <p className="text-xs text-(--toast-fg-muted) mt-1.5 pl-9 line-clamp-2 overflow-hidden m-0">
          {subtitle}
        </p>
      )}
      {actions != null && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 pl-9">
          {actions.map((a, i) => (
            <button
              key={i}
              type="button"
              className="text-sm text-(--toast-fg-muted) hover:text-(--toast-fg) cursor-pointer font-inherit leading-snug p-0 border-0 bg-transparent"
              onClick={() => {
                a.onClick();
                toastLib.dismiss(toast.id);
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

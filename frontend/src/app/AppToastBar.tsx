/**
 * Toast adapter — typed `toast` API + react-hot-toast renderer.
 * One toast at a time (new replaces existing). UI lives in overlays/toast.
 *
 * Duration: Toaster uses Infinity. Success/info auto-dismiss via Toast countdown;
 * error/warning/loading persist until dismiss or replacement.
 */

import React from 'react';
import toastLib, { resolveValue, type Toast } from 'react-hot-toast';
import {
  ToastError,
  ToastInfo,
  ToastLoading,
  ToastSuccess,
  ToastWarning,
  DEFAULT_TOAST_TITLES,
  type ToastAction,
  type ToastVariant,
} from '@/components/overlays/toast';
export interface ToastMessageObject {
  title?: string;
  subtitle?: string;
  actions?: ToastAction[];
  variant?: 'info' | 'warning';
}

type ToastMessage = Parameters<typeof toastLib>[0] | ToastMessageObject;

const PERSIST_OPTS = { duration: Infinity } as const;

/** Dismiss all toasts so only one is active; new toast replaces existing. */
function dismissThen<A extends unknown[], R extends string>(fn: (...args: A) => R): (...args: A) => R {
  return ((...args: A) => {
    toastLib.dismiss();
    return fn(...args);
  }) as (...args: A) => R;
}

function isToastMessageObject(value: unknown): value is ToastMessageObject {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.title === 'string' ||
    typeof record.subtitle === 'string' ||
    Array.isArray(record.actions) ||
    record.variant === 'info' ||
    record.variant === 'warning'
  );
}

function asVariantMessage(msg: ToastMessage, variant: 'info' | 'warning'): ToastMessageObject {
  if (typeof msg === 'string') return { title: msg, variant };
  if (isToastMessageObject(msg)) return { ...msg, variant };
  return { title: String(msg), variant };
}

/**
 * Typed toast API: one toast at a time; message can be string or ToastMessageObject.
 */
// eslint-disable-next-line react-refresh/only-export-components -- single file for toast API + adapter
export const toast = Object.assign(
  dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib>[1]) =>
    toastLib(msg as Parameters<typeof toastLib>[0], { ...PERSIST_OPTS, ...opts })
  ),
  {
    success: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib.success>[1]) =>
      toastLib.success(msg as Parameters<typeof toastLib.success>[0], { ...PERSIST_OPTS, ...opts })
    ),
    error: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib.error>[1]) =>
      toastLib.error(msg as Parameters<typeof toastLib.error>[0], { ...PERSIST_OPTS, ...opts })
    ),
    warning: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib>[1]) =>
      toastLib(asVariantMessage(msg, 'warning') as Parameters<typeof toastLib>[0], {
        ...PERSIST_OPTS,
        ...opts,
      })
    ),
    info: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib>[1]) =>
      toastLib(asVariantMessage(msg, 'info') as Parameters<typeof toastLib>[0], {
        ...PERSIST_OPTS,
        ...opts,
      })
    ),
    loading: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib.loading>[1]) =>
      toastLib.loading(msg as Parameters<typeof toastLib.loading>[0], { ...PERSIST_OPTS, ...opts })
    ),
    custom: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib.custom>[1]) =>
      toastLib.custom(msg as Parameters<typeof toastLib.custom>[0], { ...PERSIST_OPTS, ...opts })
    ),
    dismiss: toastLib.dismiss,
    promise: toastLib.promise,
    remove: toastLib.remove,
  }
);

if (import.meta.env.DEV) {
  (globalThis as { __atlasToast?: typeof toast }).__atlasToast = toast;
}

function getEffectiveVariant(hostToast: Toast, raw: unknown): ToastVariant {
  if (isToastMessageObject(raw) && raw.variant === 'info') return 'info';
  if (isToastMessageObject(raw) && raw.variant === 'warning') return 'warning';
  if (hostToast.type === 'success') return 'success';
  if (hostToast.type === 'error') return 'error';
  if (hostToast.type === 'loading') return 'loading';
  return 'success';
}

function resolveContent(
  raw: unknown,
  variant: ToastVariant
): { title: string; subtitle?: string; actions?: ToastAction[] } {
  if (isToastMessageObject(raw)) {
    return {
      title: raw.title?.trim() || DEFAULT_TOAST_TITLES[variant],
      subtitle: raw.subtitle,
      actions: raw.actions,
    };
  }
  return { title: String(raw ?? DEFAULT_TOAST_TITLES[variant]) };
}

export interface AppToastBarProps {
  toast: Toast;
}

const VARIANT_COMPONENT = {
  success: ToastSuccess,
  error: ToastError,
  warning: ToastWarning,
  info: ToastInfo,
  loading: ToastLoading,
} as const;

/**
 * Maps a react-hot-toast record onto the matching Toast derivative.
 */
export const AppToastBar: React.FC<AppToastBarProps> = ({ toast: hostToast }) => {
  const raw = resolveValue(hostToast.message, hostToast);
  const variant = getEffectiveVariant(hostToast, raw);
  const content = resolveContent(raw, variant);
  const VariantToast = VARIANT_COMPONENT[variant];

  return (
    <VariantToast
      key={hostToast.id}
      title={content.title}
      subtitle={content.subtitle}
      actions={content.actions}
      customIcon={hostToast.icon}
      ariaProps={hostToast.ariaProps}
      onDismiss={() => {
        toastLib.dismiss(hostToast.id, hostToast.toasterId);
      }}
    />
  );
};

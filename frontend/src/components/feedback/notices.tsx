/**
 * Toasts, inline alerts, and full-page error fallback — one surface (toast-card) and shared controls.
 * Catalog-driven toasts: import `toast` only from `@/utils/feedback` in feature code.
 */
/* eslint-disable react-refresh/only-export-components */

import React, { type HTMLAttributes, type ReactNode } from 'react';
import toastLib, { resolveValue, type Toast as HotToast } from 'react-hot-toast';
import { Icon } from '@/components/primitives/Icon';
import { IconKeys, TOAST_ICON_KEYS } from '@/config/icons';
import { RADIUS, TOAST_TYPE, text } from '@/theme/recipes';
import { cn } from '@/utils';

// ---------------------------------------------------------------------------
// Types & tokens
// ---------------------------------------------------------------------------

export interface NoticeAction {
  label: string;
  onClick: () => void;
}

export type ToastAction = NoticeAction;
export type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'loading';
export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export const TOAST_DEFAULT_DURATION_MS = 4000;

export const DEFAULT_TOAST_TITLES: Record<ToastVariant, string> = {
  success: 'Success',
  error: 'Error',
  info: 'Informational',
  warning: 'Warning',
  loading: 'Loading',
};

const SURFACE: Record<ToastVariant, string> = {
  success: 'toast-card toast-card--success',
  error: 'toast-card toast-card--error',
  info: 'toast-card toast-card--info',
  warning: 'toast-card toast-card--warning',
  loading: 'toast-card toast-card--loading',
};

const ICON_ACCENT: Record<ToastVariant, string> = {
  success: 'text-toast-success',
  error: 'text-toast-danger',
  info: 'text-toast-info',
  warning: 'text-toast-warning',
  loading: 'text-toast-fg-muted',
};

function toVisualVariant(variant: AlertVariant | ToastVariant): ToastVariant {
  return variant === 'danger' ? 'error' : (variant as ToastVariant);
}

export function noticeSurfaceClass(variant: ToastVariant): string {
  return SURFACE[variant];
}

export function noticeIconClass(variant: ToastVariant): string {
  return ICON_ACCENT[variant];
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function NoticeIcon({
  variant,
  customIcon,
  className,
}: {
  variant: ToastVariant;
  customIcon?: ReactNode;
  className?: string;
}) {
  const accent = noticeIconClass(variant);

  if (customIcon !== undefined) {
    return (
      <span className={cn('mt-space-0-5 shrink-0 flex items-center justify-center', accent, className)}>
        {customIcon}
      </span>
    );
  }

  if (variant === 'loading') {
    return (
      <span
        className={cn(
          `mt-space-0-5 shrink-0 w-5 h-5 ${RADIUS.pill} border-2 animate-spin border-current/30 border-t-current`,
          accent,
          className
        )}
        role="img"
        aria-hidden
      />
    );
  }

  const iconKey = TOAST_ICON_KEYS[variant];
  if (!iconKey) return null;
  return <Icon iconKey={iconKey} className={cn('mt-space-0-5 shrink-0 w-5 h-5', accent, className)} />;
}

function NoticeDismissButton({ onClick, ariaLabel = 'Dismiss' }: { onClick: () => void; ariaLabel?: string }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`shrink-0 self-start -mr-space-1 -mt-space-0-5 flex h-7 w-7 items-center justify-center ${RADIUS.surface} border-0 bg-transparent p-0 text-toast-close hover:text-toast-fg-muted cursor-pointer`}
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Icon iconKey={IconKeys.actions.close} className="w-4 h-4 pointer-events-none" />
    </button>
  );
}

export function NoticeActionChip({
  action,
  className,
}: {
  action: NoticeAction;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        `mt-space-2 inline-flex items-center ${RADIUS.surface} border border-toast-action-border px-space-2-5 py-space-0-5 ${TOAST_TYPE.action} hover:bg-toast-action-hover cursor-pointer`,
        className
      )}
      onClick={e => {
        e.stopPropagation();
        action.onClick();
      }}
    >
      {action.label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Notice card (toast + inline alert)
// ---------------------------------------------------------------------------

interface NoticeCardProps {
  variant: ToastVariant;
  layout: 'toast' | 'inline';
  title?: string;
  subtitle?: string;
  body?: ReactNode;
  actions?: NoticeAction[];
  onDismiss?: () => void;
  dismissAriaLabel?: string;
  customIcon?: ReactNode;
  iconClassName?: string;
  className?: string;
  ariaProps?: HTMLAttributes<HTMLDivElement>;
}

function NoticeCard({
  variant,
  layout,
  title,
  subtitle,
  body,
  actions,
  onDismiss,
  dismissAriaLabel,
  customIcon,
  iconClassName,
  className,
  ariaProps,
}: NoticeCardProps) {
  const role =
    variant === 'error' || variant === 'warning' ? 'alert' : layout === 'toast' ? 'status' : 'alert';

  return (
    <div
      className={cn(
        `flex items-start gap-space-3 ${RADIUS.notice} p-panel font-sans`,
        layout === 'toast'
          ? 'w-[380px] max-w-[calc(100vw-2rem)] pointer-events-auto'
          : 'w-full',
        noticeSurfaceClass(variant),
        className
      )}
      {...ariaProps}
      role={role}
    >
      <NoticeIcon variant={variant} customIcon={customIcon} className={iconClassName} />
      <div className="min-w-0 flex-1">
        {title != null ? (
          <>
            <p className={`m-0 ${TOAST_TYPE.title}`}>{title}</p>
            {subtitle ? <p className={`mt-space-1 mb-0 ${TOAST_TYPE.subtitle}`}>{subtitle}</p> : null}
          </>
        ) : (
          <div className={cn(TOAST_TYPE.subtitle, 'text-toast-fg [&_*]:text-inherit')}>{body}</div>
        )}
        {actions?.map(action => (
          <NoticeActionChip key={action.label} action={action} />
        ))}
      </div>
      {onDismiss ? <NoticeDismissButton onClick={onDismiss} ariaLabel={dismissAriaLabel} /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast & Alert
// ---------------------------------------------------------------------------

export interface ToastProps {
  title: string;
  subtitle?: string;
  actions?: NoticeAction[];
  onDismiss?: () => void;
  customIcon?: ReactNode;
  className?: string;
  ariaProps?: HTMLAttributes<HTMLDivElement>;
}

export interface BaseToastProps extends ToastProps {
  variant: ToastVariant;
}

export const Toast = React.memo<BaseToastProps>(
  ({ variant, title, subtitle, actions, onDismiss, customIcon, className, ariaProps }) => (
    <NoticeCard
      variant={variant}
      layout="toast"
      title={title}
      subtitle={subtitle}
      actions={actions}
      onDismiss={onDismiss}
      customIcon={customIcon}
      className={className}
      ariaProps={ariaProps}
    />
  )
);
Toast.displayName = 'Toast';

export interface AlertProps {
  children?: ReactNode;
  title?: string;
  description?: string;
  variant?: AlertVariant;
  actions?: NoticeAction[];
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  title,
  description,
  variant = 'info',
  actions,
  onClose,
  className,
}) => (
  <NoticeCard
    variant={toVisualVariant(variant)}
    layout="inline"
    title={title}
    subtitle={description}
    body={title == null ? children : undefined}
    actions={actions}
    onDismiss={onClose}
    dismissAriaLabel="Close alert"
    className={className}
  />
);

// ---------------------------------------------------------------------------
// Full-page error fallback
// ---------------------------------------------------------------------------

const FALLBACK_TYPE = {
  title: `${text({ role: 'title-section' })} font-semibold leading-snug text-toast-fg`,
  subtitle: `${text({ role: 'body' })} leading-relaxed text-toast-fg-muted`,
  detail: `${text({ role: 'body' })} text-toast-fg-muted`,
} as const;

const FALLBACK_ACTION = cn(text({ role: 'body' }), 'mt-0 px-space-3 py-space-1');

export interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
  homeHref?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry, homeHref = '/' }) => {
  const errorIconKey = TOAST_ICON_KEYS.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-page px-space-4">
      <div
        className={cn(
          `flex w-full max-w-lg flex-col ${RADIUS.notice} p-space-8 font-sans`,
          noticeSurfaceClass('error')
        )}
        role="alert"
      >
        <div className="flex items-center gap-space-3">
          {errorIconKey ? (
            <Icon iconKey={errorIconKey} className={cn('h-7 w-7 shrink-0', noticeIconClass('error'))} />
          ) : null}
          <p className={`m-0 min-w-0 ${FALLBACK_TYPE.title}`}>Something went wrong</p>
        </div>
        <p className={`mt-space-3 mb-0 ${FALLBACK_TYPE.subtitle}`}>
          We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
        </p>
        {error ? (
          <div
            className={`mt-space-5 p-space-4 ${RADIUS.field} border border-toast-border bg-toast-footer-bg overflow-auto max-h-52 ${FALLBACK_TYPE.detail}`}
          >
            <p className="mb-space-1 font-normal text-toast-fg">Error details</p>
            <p>{error.message}</p>
            {import.meta.env.DEV && error.stack ? (
              <pre className={`mt-space-2 whitespace-pre-wrap font-mono text-[0.8125rem] ${FALLBACK_TYPE.detail}`}>
                {error.stack}
              </pre>
            ) : null}
          </div>
        ) : null}
        <div className="mt-space-6 flex flex-wrap justify-end gap-space-3">
          <NoticeActionChip className={FALLBACK_ACTION} action={{ label: 'Try Again', onClick: onRetry }} />
          <NoticeActionChip
            className={FALLBACK_ACTION}
            action={{ label: 'Go Home', onClick: () => { window.location.href = homeHref; } }}
          />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// react-hot-toast adapter
// ---------------------------------------------------------------------------

interface ToastMessageObject {
  title?: string;
  subtitle?: string;
  actions?: NoticeAction[];
  variant?: 'info' | 'warning';
}

type ToastMessage = Parameters<typeof toastLib>[0] | ToastMessageObject;

const AUTO_DISMISS = { duration: TOAST_DEFAULT_DURATION_MS } as const;
const PERSIST = { duration: Infinity } as const;

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

export const toast = Object.assign(
  dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib>[1]) =>
    toastLib(msg as Parameters<typeof toastLib>[0], { ...AUTO_DISMISS, ...opts })
  ),
  {
    success: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib.success>[1]) =>
      toastLib.success(msg as Parameters<typeof toastLib.success>[0], { ...AUTO_DISMISS, ...opts })
    ),
    error: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib.error>[1]) =>
      toastLib.error(msg as Parameters<typeof toastLib.error>[0], { ...PERSIST, ...opts })
    ),
    warning: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib>[1]) =>
      toastLib(asVariantMessage(msg, 'warning') as Parameters<typeof toastLib>[0], { ...PERSIST, ...opts })
    ),
    info: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib>[1]) =>
      toastLib(asVariantMessage(msg, 'info') as Parameters<typeof toastLib>[0], { ...AUTO_DISMISS, ...opts })
    ),
    loading: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib.loading>[1]) =>
      toastLib.loading(msg as Parameters<typeof toastLib.loading>[0], { ...PERSIST, ...opts })
    ),
    custom: dismissThen((msg: ToastMessage, opts?: Parameters<typeof toastLib.custom>[1]) =>
      toastLib.custom(msg as Parameters<typeof toastLib.custom>[0], { ...AUTO_DISMISS, ...opts })
    ),
    dismiss: toastLib.dismiss,
    promise: toastLib.promise,
    remove: toastLib.remove,
  }
);

if (import.meta.env.DEV) {
  (globalThis as { __atlasToast?: typeof toast }).__atlasToast = toast;
}

function hostVariant(hostToast: HotToast, raw: unknown): ToastVariant {
  if (isToastMessageObject(raw) && raw.variant === 'info') return 'info';
  if (isToastMessageObject(raw) && raw.variant === 'warning') return 'warning';
  if (hostToast.type === 'success') return 'success';
  if (hostToast.type === 'error') return 'error';
  if (hostToast.type === 'loading') return 'loading';
  return 'success';
}

function hostContent(raw: unknown, variant: ToastVariant) {
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
  toast: HotToast;
}

export const AppToastBar = React.memo<AppToastBarProps>(({ toast: hostToast }) => {
  const raw = resolveValue(hostToast.message, hostToast);
  const variant = hostVariant(hostToast, raw);
  const content = hostContent(raw, variant);
  const onDismiss = React.useCallback(() => {
    toastLib.dismiss(hostToast.id, hostToast.toasterId);
  }, [hostToast.id, hostToast.toasterId]);

  return (
    <Toast
      variant={variant}
      title={content.title}
      subtitle={content.subtitle}
      actions={content.actions}
      customIcon={hostToast.icon}
      ariaProps={hostToast.ariaProps}
      onDismiss={onDismiss}
    />
  );
});
AppToastBar.displayName = 'AppToastBar';

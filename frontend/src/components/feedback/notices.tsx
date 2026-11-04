/**
 * Transient feedback (single alert toast), inline alerts, and full-page error fallback.
 * Catalog-driven toasts: use {@link notify.show} from `@/utils/feedback` in feature code.
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

/** Copy shown for every transient toast notification. */
export const TOAST_ALERT_MESSAGE = 'Something went wrong';

export const TOAST_DEFAULT_DURATION_MS = 4000;

const INLINE_SURFACE: Record<ToastVariant, string> = {
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
  return INLINE_SURFACE[variant];
}

export function noticeIconClass(variant: ToastVariant): string {
  return ICON_ACCENT[variant];
}

// ---------------------------------------------------------------------------
// Shared pieces (inline alerts + error fallback)
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
      className={`shrink-0 -mr-space-0-5 flex h-5 w-5 items-center justify-center ${RADIUS.surface} border-0 bg-transparent p-0 text-toast-close hover:text-toast-fg-muted cursor-pointer`}
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Icon iconKey={IconKeys.actions.close} className="w-3 h-3 pointer-events-none" />
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

interface NoticeCardProps {
  variant: ToastVariant;
  layout: 'inline';
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
  return (
    <div
      className={cn(
        `flex items-start gap-space-3 w-full ${RADIUS.notice} p-panel font-sans`,
        noticeSurfaceClass(variant),
        className
      )}
      {...ariaProps}
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'alert'}
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
// Inline alert (forms, banners — not transient toast)
// ---------------------------------------------------------------------------

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
// Transient alert toast (single message)
// ---------------------------------------------------------------------------

export interface ToastAlertProps {
  message?: string;
  variant?: ToastVariant;
  onDismiss?: () => void;
  ariaProps?: HTMLAttributes<HTMLDivElement>;
}

export const ToastAlert = React.memo<ToastAlertProps>(({ message, variant = 'success', onDismiss, ariaProps }) => {
  const copy = message?.trim() || TOAST_ALERT_MESSAGE;
  const visual: ToastVariant = variant === 'info' ? 'info' : variant;
  const iconKey = TOAST_ICON_KEYS[visual === 'loading' ? 'loading' : visual];
  const role = visual === 'error' || visual === 'warning' ? 'alert' : 'status';

  return (
    <div
      className={cn(
        `flex items-center gap-space-2 py-space-1 px-space-2-5 font-sans ${RADIUS.notice}`,
        'w-max max-w-[min(100vw-2rem,20rem)] pointer-events-auto',
        noticeSurfaceClass(visual)
      )}
      {...ariaProps}
      role={role}
    >
      {visual === 'loading' ? (
        <NoticeIcon variant="loading" className="mt-0 h-3.5 w-3.5" />
      ) : iconKey ? (
        <Icon iconKey={iconKey} className={cn('h-3.5 w-3.5 shrink-0', noticeIconClass(visual))} />
      ) : null}
      <p className={cn('m-0 min-w-0 flex-1 truncate', TOAST_TYPE.compact)}>{copy}</p>
      {onDismiss ? <NoticeDismissButton onClick={onDismiss} /> : null}
    </div>
  );
});
ToastAlert.displayName = 'ToastAlert';

// ---------------------------------------------------------------------------
// Full-page error fallback
// ---------------------------------------------------------------------------

const FALLBACK_TYPE = {
  title: `${text({ role: 'title-section' })} font-semibold leading-snug text-toast-fg`,
  subtitle: `${text({ role: 'body' })} leading-relaxed text-toast-fg-muted`,
  detail: `${text({ role: 'body' })} text-toast-fg-muted`,
} as const;

const FALLBACK_ACTION = cn(text({ role: 'body' }), 'mt-0 px-space-3 py-space-1');

function formatErrorDetail(error: Error): string {
  const msg: unknown = error.message;
  if (typeof msg === 'string') return msg;
  if (msg != null && typeof msg === 'object') {
    try {
      return JSON.stringify(msg);
    } catch {
      return 'Unknown error';
    }
  }
  return String(error);
}

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
          <p className={`m-0 min-w-0 ${FALLBACK_TYPE.title}`}>{TOAST_ALERT_MESSAGE}</p>
        </div>
        <p className={`mt-space-3 mb-0 ${FALLBACK_TYPE.subtitle}`}>
          We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
        </p>
        {error ? (
          <div
            className={`mt-space-5 p-space-4 ${RADIUS.field} border border-toast-border bg-toast-footer-bg overflow-auto max-h-52 ${FALLBACK_TYPE.detail}`}
          >
            <p className="mb-space-1 font-normal text-toast-fg">Error details</p>
            <p>{formatErrorDetail(error)}</p>
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
// react-hot-toast adapter — alert() only
// ---------------------------------------------------------------------------

export interface ToastAlertPayload {
  message?: string;
  variant?: ToastVariant;
}

type ToastAlertInput = string | ToastAlertPayload;

const AUTO_DISMISS = { duration: TOAST_DEFAULT_DURATION_MS } as const;

function dismissThen<A extends unknown[], R extends string>(fn: (...args: A) => R): (...args: A) => R {
  return ((...args: A) => {
    toastLib.dismiss();
    return fn(...args);
  }) as (...args: A) => R;
}

function resolveAlert(input?: ToastAlertInput): { message: string; variant: ToastVariant } {
  if (input == null) {
    return { message: TOAST_ALERT_MESSAGE, variant: 'error' };
  }
  if (typeof input === 'string') {
    return { message: input.trim() || TOAST_ALERT_MESSAGE, variant: 'success' };
  }
  return {
    message: input.message?.trim() || TOAST_ALERT_MESSAGE,
    variant: input.variant ?? 'success',
  };
}

function hostOutcomeVariant(hostToast: HotToast): ToastVariant {
  const className = hostToast.className ?? '';
  const match = className.match(/toast-outcome-(success|error|warning|info|loading)/);
  if (match) return match[1] as ToastVariant;
  if (hostToast.type === 'success') return 'success';
  if (hostToast.type === 'error') return 'error';
  if (hostToast.type === 'loading') return 'loading';
  return 'success';
}

export const toast = {
  alert: dismissThen((input?: ToastAlertInput, opts?: Parameters<typeof toastLib>[1]) => {
    const { message, variant } = resolveAlert(input);
    const toastOpts = {
      ...AUTO_DISMISS,
      ...opts,
      className: cn(`toast-outcome-${variant}`, opts?.className),
    };
    if (variant === 'error') return toastLib.error(message, toastOpts);
    if (variant === 'success') return toastLib.success(message, toastOpts);
    return toastLib(message, toastOpts);
  }),
  dismiss: toastLib.dismiss,
  remove: toastLib.remove,
};

if (import.meta.env.DEV) {
  (globalThis as { __atlasToast?: typeof toast }).__atlasToast = toast;
}

function hostAlertMessage(raw: unknown): string {
  if (typeof raw === 'string') {
    return raw.trim() || TOAST_ALERT_MESSAGE;
  }
  if (typeof raw === 'object' && raw !== null && typeof (raw as ToastAlertPayload).message === 'string') {
    return (raw as ToastAlertPayload).message?.trim() || TOAST_ALERT_MESSAGE;
  }
  if (raw != null && typeof raw !== 'object') {
    return String(raw);
  }
  return TOAST_ALERT_MESSAGE;
}

export interface AppToastBarProps {
  toast: HotToast;
}

export const AppToastBar = React.memo<AppToastBarProps>(({ toast: hostToast }) => {
  const raw = resolveValue(hostToast.message, hostToast);
  const onDismiss = React.useCallback(() => {
    toastLib.dismiss(hostToast.id, hostToast.toasterId);
  }, [hostToast.id, hostToast.toasterId]);

  const message =
    typeof raw === 'string'
      ? raw.trim() || TOAST_ALERT_MESSAGE
      : typeof raw === 'object' && raw !== null && typeof (raw as ToastAlertPayload).message === 'string'
        ? (raw as ToastAlertPayload).message?.trim() || TOAST_ALERT_MESSAGE
        : hostAlertMessage(raw);

  return (
    <ToastAlert
      message={message}
      variant={hostOutcomeVariant(hostToast)}
      onDismiss={onDismiss}
      ariaProps={hostToast.ariaProps}
    />
  );
});
AppToastBar.displayName = 'AppToastBar';

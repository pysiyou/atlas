/**
 * Inline feedback surfaces (alerts, error fallback).
 */

import React, { type HTMLAttributes, type ReactNode } from 'react';
import { Icon } from '@/components/primitives/Icon';
import { IconKeys, TOAST_ICON_KEYS } from '@/config/icons';
import { RADIUS, TOAST_TYPE, text } from '@/theme/recipes';
import { cn } from '@/utils';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'loading';
export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface NoticeAction {
  label: string;
  onClick: () => void;
}

export const TOAST_ALERT_MESSAGE = 'Something went wrong';

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

function surfaceClass(variant: ToastVariant): string {
  return SURFACE[variant];
}

function iconClass(variant: ToastVariant): string {
  return ICON_ACCENT[variant];
}

function NoticeIcon({
  variant,
  className,
  compact,
}: {
  variant: ToastVariant;
  className?: string;
  compact?: boolean;
}) {
  const accent = iconClass(variant);
  const size = compact ? 'h-3.5 w-3.5' : 'w-5 h-5';
  const offset = compact ? 'mt-0' : 'mt-space-0-5';

  if (variant === 'loading') {
    return (
      <span
        className={cn(
          `${offset} shrink-0 ${size} ${RADIUS.pill} border-2 animate-spin border-current/30 border-t-current`,
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
  return <Icon iconKey={iconKey} className={cn(`${offset} shrink-0`, size, accent, className)} />;
}

function DismissButton({ onClick, ariaLabel = 'Dismiss' }: { onClick: () => void; ariaLabel?: string }) {
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

function NoticeAction({ action, className }: { action: NoticeAction; className?: string }) {
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

interface NoticeProps {
  density: 'compact' | 'comfortable';
  variant: ToastVariant;
  message?: string;
  title?: string;
  subtitle?: string;
  body?: ReactNode;
  actions?: NoticeAction[];
  onDismiss?: () => void;
  dismissAriaLabel?: string;
  className?: string;
  ariaProps?: HTMLAttributes<HTMLDivElement>;
}

/** Compact toast surface (also used by {@link ToastHost}). */
export function CompactNotice({
  variant,
  message,
  onDismiss,
  ariaProps,
  className,
}: Pick<NoticeProps, 'variant' | 'message' | 'onDismiss' | 'ariaProps' | 'className'>) {
  const copy = message?.trim() || TOAST_ALERT_MESSAGE;
  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';
  return (
    <div
      className={cn(
        `flex items-center gap-space-2 py-space-1 px-space-2-5 font-sans ${RADIUS.notice}`,
        'w-max max-w-[min(100vw-2rem,20rem)] pointer-events-auto',
        surfaceClass(variant),
        className,
      )}
      {...ariaProps}
      role={role}
    >
      <NoticeIcon variant={variant} compact />
      <p className={cn('m-0 min-w-0 flex-1 truncate', TOAST_TYPE.compact)}>{copy}</p>
      {onDismiss ? <DismissButton onClick={onDismiss} /> : null}
    </div>
  );
}

function Notice({
  density,
  variant,
  message,
  title,
  subtitle,
  body,
  actions,
  onDismiss,
  dismissAriaLabel,
  className,
  ariaProps,
}: NoticeProps) {
  const role = variant === 'error' || variant === 'warning' ? 'alert' : density === 'compact' ? 'status' : 'alert';

  if (density === 'compact') {
    return (
      <CompactNotice
        variant={variant}
        message={message}
        onDismiss={onDismiss}
        ariaProps={ariaProps}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        `flex items-start gap-space-3 w-full ${RADIUS.notice} p-panel font-sans`,
        surfaceClass(variant),
        className
      )}
      {...ariaProps}
      role={role}
    >
      <NoticeIcon variant={variant} />
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
          <NoticeAction key={action.label} action={action} />
        ))}
      </div>
      {onDismiss ? <DismissButton onClick={onDismiss} ariaLabel={dismissAriaLabel} /> : null}
    </div>
  );
}

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
  <Notice
    density="comfortable"
    variant={toVisualVariant(variant)}
    title={title}
    subtitle={description}
    body={title == null ? children : undefined}
    actions={actions}
    onDismiss={onClose}
    dismissAriaLabel="Close alert"
    className={className}
  />
);

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
          surfaceClass('error')
        )}
        role="alert"
      >
        <div className="flex items-center gap-space-3">
          {errorIconKey ? (
            <Icon iconKey={errorIconKey} className={cn('h-7 w-7 shrink-0', iconClass('error'))} />
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
          <NoticeAction className={FALLBACK_ACTION} action={{ label: 'Try Again', onClick: onRetry }} />
          <NoticeAction
            className={FALLBACK_ACTION}
            action={{ label: 'Go Home', onClick: () => { window.location.href = homeHref; } }}
          />
        </div>
      </div>
    </div>
  );
};

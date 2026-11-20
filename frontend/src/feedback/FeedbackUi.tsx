/**
 * Toast, alert, error fallback, and shared notice chrome.
 */
/* eslint-disable max-lines, react-refresh/only-export-components -- toast host + notice surfaces live together */

import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import toastLib, { resolveValue, useToaster, type DefaultToastOptions, type Toast as HotToast } from 'react-hot-toast';
import { Icon } from '@/components/primitives';
import { IconKeys, TOAST_ICON_KEYS } from '@/icons';
import { DIALOG, RADIUS, TOAST_TYPE, text } from '@/theme/recipes';
import { cn } from '@/utils';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'loading';
type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

interface NoticeAction {
  label: string;
  onClick: () => void;
}

export const TOAST_ALERT_MESSAGE = 'Something went wrong';
export const TOAST_DEFAULT_DURATION_MS = 4000;
const TOAST_REMOVE_DELAY_MS = 360;

const DIVIDER = 'border-border-default';
const LOGIN_HOST_Z = 50;
const HOST_CLASS = 'toast-host';

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

export const NOTICE_CARD_SHELL = `flex w-full flex-col overflow-hidden ${RADIUS.notice} font-sans`;

function toVisualVariant(variant: AlertVariant | ToastVariant): ToastVariant {
  return variant === 'danger' ? 'error' : (variant as ToastVariant);
}

function surfaceClass(variant: ToastVariant): string {
  return SURFACE[variant];
}

function iconClass(variant: ToastVariant): string {
  return ICON_ACCENT[variant];
}

function NoticeCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(NOTICE_CARD_SHELL, className)} {...props} />;
}

export function NoticeCardHeader({
  icon,
  title,
  titleClassName,
  trailing,
}: {
  icon?: ReactNode;
  title?: ReactNode;
  titleClassName?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className={cn(DIALOG.popoverHeader, 'bg-transparent border-b', DIVIDER)}>
      <div className="flex min-w-0 items-start gap-space-2">
        {icon}
        {title != null ? <p className={cn('m-0 min-w-0', titleClassName)}>{title}</p> : null}
      </div>
      {trailing}
    </div>
  );
}

export function NoticeCardBody({
  padded = true,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return <div className={cn('min-w-0', padded && 'px-space-4 py-space-3', className)} {...props} />;
}

export function NoticeCardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(DIALOG.popoverFooter, 'bg-transparent border-t', DIVIDER, className)} {...props} />
  );
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
        `inline-flex items-center ${RADIUS.surface} border border-toast-action-border px-space-2-5 py-space-0-5 ${TOAST_TYPE.action} hover:bg-toast-action-hover cursor-pointer`,
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

function CompactNotice({
  variant,
  message,
  onDismiss,
  ariaProps,
  className,
}: {
  variant: ToastVariant;
  message?: string;
  onDismiss?: () => void;
  ariaProps?: HTMLAttributes<HTMLDivElement>;
  className?: string;
}) {
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

export interface AlertProps {
  children?: ReactNode;
  title?: string;
  description?: string;
  variant?: AlertVariant;
  actions?: NoticeAction[];
  onClose?: () => void;
  className?: string;
}

export function Alert({
  children,
  title,
  description,
  variant = 'info',
  actions,
  onClose,
  className,
}: AlertProps) {
  const visual = toVisualVariant(variant);
  const body = title == null ? children : undefined;
  return (
    <NoticeCard className={cn(surfaceClass(visual), className)} role="alert">
      <NoticeCardHeader
        icon={<NoticeIcon variant={visual} />}
        title={title}
        titleClassName={TOAST_TYPE.title}
        trailing={onClose ? <DismissButton onClick={onClose} ariaLabel="Close alert" /> : null}
      />
      {description || body ? (
        <NoticeCardBody>
          {description ? <p className={cn('m-0', TOAST_TYPE.subtitle)}>{description}</p> : null}
          {body ? (
            <div className={cn(TOAST_TYPE.subtitle, 'text-toast-fg [&_*]:text-inherit', description && 'mt-space-1')}>
              {body}
            </div>
          ) : null}
        </NoticeCardBody>
      ) : null}
      {actions?.length ? (
        <NoticeCardFooter>
          {actions.map(action => (
            <NoticeAction key={action.label} action={action} />
          ))}
        </NoticeCardFooter>
      ) : null}
    </NoticeCard>
  );
}

const FALLBACK_TYPE = {
  title: `${text({ role: 'title-section' })} font-semibold leading-snug text-toast-fg`,
  subtitle: `${text({ role: 'body' })} leading-relaxed text-toast-fg-muted`,
  detail: `${text({ role: 'body' })} text-toast-fg-muted`,
} as const;

const FALLBACK_ACTION = cn(text({ role: 'body' }), 'px-space-3 py-space-1');

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

export function ErrorFallback({ error, onRetry, homeHref = '/' }: ErrorFallbackProps) {
  const errorIconKey = TOAST_ICON_KEYS.error;
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-page px-space-4">
      <NoticeCard className={cn('max-w-lg', surfaceClass('error'))} role="alert">
        <NoticeCardHeader
          icon={
            errorIconKey ? (
              <Icon iconKey={errorIconKey} className={cn('mt-space-0-5 h-5 w-5 shrink-0', iconClass('error'))} />
            ) : null
          }
          title={TOAST_ALERT_MESSAGE}
          titleClassName={FALLBACK_TYPE.title}
        />
        <NoticeCardBody>
          <p className={cn('m-0', FALLBACK_TYPE.subtitle)}>
            We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          {error ? (
            <div className={`mt-space-3 p-space-4 ${RADIUS.field} border border-toast-border bg-toast-footer-bg overflow-auto max-h-52 ${FALLBACK_TYPE.detail}`}>
              <p className="mb-space-1 font-normal text-toast-fg">Error details</p>
              <p>{formatErrorDetail(error)}</p>
              {import.meta.env.DEV && error.stack ? (
                <pre className={`mt-space-2 whitespace-pre-wrap font-mono text-[0.8125rem] ${FALLBACK_TYPE.detail}`}>{error.stack}</pre>
              ) : null}
            </div>
          ) : null}
        </NoticeCardBody>
        <NoticeCardFooter className="justify-end">
          <NoticeAction className={FALLBACK_ACTION} action={{ label: 'Try Again', onClick: onRetry }} />
          <NoticeAction className={FALLBACK_ACTION} action={{ label: 'Go Home', onClick: () => { window.location.href = homeHref; } }} />
        </NoticeCardFooter>
      </NoticeCard>
    </div>
  );
}

const ToastMountContext = React.createContext<HTMLElement | null>(null);
const ToastMountSetterContext = React.createContext<(node: HTMLElement | null) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  return (
    <ToastMountContext.Provider value={mount}>
      <ToastMountSetterContext.Provider value={setMount}>{children}</ToastMountSetterContext.Provider>
    </ToastMountContext.Provider>
  );
}

export function useToastMountRef(): (node: HTMLDivElement | null) => void {
  const setMount = useContext(ToastMountSetterContext);
  useEffect(() => () => setMount(null), [setMount]);
  return useCallback((node: HTMLDivElement | null) => setMount(node), [setMount]);
}

function afterPaint(run: () => void): void {
  queueMicrotask(() => requestAnimationFrame(run));
}

function outcomeFromHost(host: HotToast): ToastVariant {
  const match = (host.className ?? '').match(/toast-outcome-(success|error|warning|info|loading)/);
  if (match) return match[1] as ToastVariant;
  if (host.type === 'error') return 'error';
  if (host.type === 'loading') return 'loading';
  return 'success';
}

const ToastChip = React.memo(({ toast: host }: { toast: HotToast }) => {
  const raw = resolveValue(host.message, host);
  const message = typeof raw === 'string' ? raw.trim() || TOAST_ALERT_MESSAGE : TOAST_ALERT_MESSAGE;
  const dismiss = useCallback(() => {
    toastLib.dismiss(host.id, host.toasterId);
  }, [host.id, host.toasterId]);

  return (
    <div className={cn('toast-chip-motion pointer-events-auto', host.visible ? 'toast-chip-enter' : 'toast-chip-exit')}>
      <CompactNotice variant={outcomeFromHost(host)} message={message} onDismiss={dismiss} ariaProps={host.ariaProps} />
    </div>
  );
});
ToastChip.displayName = 'ToastChip';

export function ToastHost({ toastOptions }: { toastOptions?: DefaultToastOptions }) {
  const mount = useContext(ToastMountContext);
  const { toasts } = useToaster({
    removeDelay: TOAST_REMOVE_DELAY_MS,
    ...toastOptions,
  });

  if (toasts.length === 0) return null;

  const stack = (
    <div data-rht-toaster="" className={cn(HOST_CLASS, 'flex flex-col items-end gap-space-2')}>
      {toasts.map(t => (
        <ToastChip key={t.id} toast={t} />
      ))}
    </div>
  );

  if (mount) return createPortal(stack, mount);

  return createPortal(
    <div
      className="pointer-events-none fixed top-space-4 right-space-4 w-max max-w-[min(100vw-2rem,20rem)]"
      style={{ zIndex: LOGIN_HOST_Z }}
    >
      {stack}
    </div>,
    document.body,
  );
}

export function showToast(message: string, variant: ToastVariant): void {
  toastLib.dismiss();
  const copy = message.trim() || TOAST_ALERT_MESSAGE;
  const opts = {
    duration: TOAST_DEFAULT_DURATION_MS,
    className: cn(`toast-outcome-${variant}`),
  };
  afterPaint(() => {
    if (variant === 'error') toastLib.error(copy, opts);
    else if (variant === 'success') toastLib.success(copy, opts);
    else toastLib(copy, opts);
  });
}

if (import.meta.env.DEV) {
  (globalThis as { __atlasShowToast?: typeof showToast }).__atlasShowToast = showToast;
}

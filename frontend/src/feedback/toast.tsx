/**
 * Catalog toasts: deferred dispatch, chrome portal host (no viewport overlay).
 */
/* eslint-disable react-refresh/only-export-components -- host UI + showToast dispatcher */
import React, { useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import toastLib, { resolveValue, useToaster, type DefaultToastOptions, type Toast as HotToast } from 'react-hot-toast';
import { cn } from '@/utils';
import { CompactNotice, TOAST_ALERT_MESSAGE, type ToastVariant } from './ui';

export const TOAST_DEFAULT_DURATION_MS = 4000;

const LOGIN_HOST_Z = 50;
const HOST_CLASS = 'toast-host';

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

/** Ref callback for the chrome header slot that receives portaled toasts. */
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
    <CompactNotice
      variant={outcomeFromHost(host)}
      message={message}
      onDismiss={dismiss}
      ariaProps={host.ariaProps}
    />
  );
});
ToastChip.displayName = 'ToastChip';

export function ToastHost({ toastOptions }: { toastOptions?: DefaultToastOptions }) {
  const mount = useContext(ToastMountContext);
  const { toasts } = useToaster(toastOptions);

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
  const text = message.trim() || TOAST_ALERT_MESSAGE;
  const opts = {
    duration: TOAST_DEFAULT_DURATION_MS,
    className: cn(`toast-outcome-${variant}`),
  };
  afterPaint(() => {
    if (variant === 'error') toastLib.error(text, opts);
    else if (variant === 'success') toastLib.success(text, opts);
    else toastLib(text, opts);
  });
}

if (import.meta.env.DEV) {
  (globalThis as { __atlasShowToast?: typeof showToast }).__atlasShowToast = showToast;
}

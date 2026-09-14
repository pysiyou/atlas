/**
 * Toast.tsx — Base presentational toast card.
 *
 * Title + subtitle, optional actions, close control, and an optional
 * countdown footer ("click to stop") with a variant-colored progress bar.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/primitives/Icon';
import { cn } from '@/utils';
import {
  TOAST_ACCENT,
  TOAST_DEFAULT_DURATION_MS,
  TOAST_ICON_CLASS,
  TOAST_ICON_NAME,
} from './toastHelpers';
import type { ToastAction, ToastProps, ToastVariant } from './toastTypes';

export interface BaseToastProps extends ToastProps {
  variant: ToastVariant;
}

function ToastIcon({
  variant,
  customIcon,
}: {
  variant: ToastVariant;
  customIcon?: React.ReactNode;
}) {
  if (customIcon !== undefined) {
    return (
      <span className="mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center">{customIcon}</span>
    );
  }

  if (variant === 'loading') {
    return (
      <span
        className={cn(
          'mt-0.5 shrink-0 w-5 h-5 rounded-full border-2',
          'border-(--toast-fg-muted) border-t-(--toast-fg) animate-spin'
        )}
        role="img"
        aria-hidden
      />
    );
  }

  const iconName = TOAST_ICON_NAME[variant];
  if (!iconName) return null;

  return (
    <Icon
      name={iconName}
      className={cn('mt-0.5 shrink-0 w-5 h-5', TOAST_ICON_CLASS[variant])}
    />
  );
}

function ActionChip({ action }: { action: ToastAction }) {
  return (
    <button
      type="button"
      className={cn(
        'mt-2.5 inline-flex items-center rounded-lg border px-3 py-1 text-sm',
        'border-(--toast-action-border) bg-transparent text-(--toast-fg)',
        'hover:bg-(--toast-action-hover) cursor-pointer'
      )}
      onClick={event => {
        event.stopPropagation();
        action.onClick();
      }}
    >
      {action.label}
    </button>
  );
}

/**
 * Base toast card. Derivatives set variant and duration defaults.
 */
export const Toast: React.FC<BaseToastProps> = ({
  variant,
  title,
  subtitle,
  actions,
  onDismiss,
  persist = false,
  durationMs = TOAST_DEFAULT_DURATION_MS,
  showCountdown,
  customIcon,
  className = '',
  ariaProps,
}) => {
  const countdownEnabled = showCountdown ?? (!persist && (variant === 'success' || variant === 'info'));
  const [paused, setPaused] = useState(false);
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const remainingRef = useRef(durationMs);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    remainingRef.current = durationMs;
    setRemainingMs(durationMs);
    setPaused(false);
  }, [durationMs, title, subtitle]);

  useEffect(() => {
    if (persist || paused || !countdownEnabled) return undefined;

    const tickMs = 50;
    const intervalId = window.setInterval(() => {
      remainingRef.current = Math.max(0, remainingRef.current - tickMs);
      setRemainingMs(remainingRef.current);
      if (remainingRef.current <= 0) {
        window.clearInterval(intervalId);
        onDismissRef.current?.();
      }
    }, tickMs);

    return () => window.clearInterval(intervalId);
  }, [persist, paused, countdownEnabled]);

  const accent = TOAST_ACCENT[variant];
  const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
  const progressPct = durationMs > 0 ? (remainingMs / durationMs) * 100 : 0;
  const showFooter = countdownEnabled && !paused && remainingMs > 0;
  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';

  const handlePause = () => {
    if (!showFooter) return;
    setPaused(true);
  };

  return (
    <div
      className={cn(
        'relative w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl',
        'bg-(--toast-bg) text-(--toast-fg) font-sans pointer-events-auto shadow-lg',
        'ring-1 ring-(--toast-action-border)',
        className
      )}
      role={role}
      {...ariaProps}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-12"
        style={{
          background: `linear-gradient(to bottom, color-mix(in srgb, ${accent} 32%, transparent), transparent)`,
        }}
      />

      <div className="relative flex items-start gap-3 px-4 pt-4 pb-3.5">
        <ToastIcon variant={variant} customIcon={customIcon} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[15px] font-semibold leading-snug text-(--toast-fg)">{title}</p>
          {subtitle ? (
            <p className="mt-1 mb-0 text-[13px] leading-snug text-(--toast-fg-muted)">{subtitle}</p>
          ) : null}
          {actions?.map(action => (
            <ActionChip key={action.label} action={action} />
          ))}
        </div>
        {onDismiss ? (
          <button
            type="button"
            aria-label="Dismiss"
            className={cn(
              'shrink-0 -mr-1 -mt-0.5 flex h-7 w-7 items-center justify-center rounded-md',
              'border-0 bg-transparent p-0 text-(--toast-close) cursor-pointer',
              'hover:text-(--toast-fg) hover:bg-(--toast-action-hover)'
            )}
            onClick={event => {
              event.stopPropagation();
              onDismiss();
            }}
          >
            <Icon name="cross" className="w-4 h-4 pointer-events-none" />
          </button>
        ) : null}
      </div>

      {showFooter ? (
        <button
          type="button"
          className={cn(
            'relative block w-full border-0 px-4 pt-2 pb-3 text-left cursor-pointer',
            'bg-(--toast-footer-bg) text-[12px] leading-snug text-(--toast-fg-muted)'
          )}
          onClick={handlePause}
        >
          This message will close in {remainingSeconds} second{remainingSeconds === 1 ? '' : 's'}.{' '}
          <span className="font-semibold text-(--toast-fg)">Click to stop.</span>
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-0.5 bg-(--toast-track)"
          >
            <span
              className="block h-full origin-left"
              style={{
                width: `${progressPct}%`,
                backgroundColor: accent,
              }}
            />
          </span>
        </button>
      ) : null}
    </div>
  );
};

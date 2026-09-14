/**
 * Toast.tsx — Lightweight toast card (title, subtitle, optional actions, dismiss).
 */

import React from 'react';
import { Icon } from '@/components/primitives/Icon';
import { cn } from '@/utils';
import { getToastIconClasses, getToastSurfaceClasses, TOAST_ICON_NAME } from './toastHelpers';
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
  const accentClass = getToastIconClasses(variant);

  if (customIcon !== undefined) {
    return (
      <span className={cn('mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center', accentClass)}>
        {customIcon}
      </span>
    );
  }

  if (variant === 'loading') {
    return (
      <span
        className={cn(
          'mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 animate-spin',
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

  return <Icon name={iconName} className={cn('mt-0.5 shrink-0 w-5 h-5', accentClass)} />;
}

function ActionChip({ action }: { action: ToastAction }) {
  return (
    <button
      type="button"
      className="mt-2 inline-flex items-center rounded-md border border-border-default px-2.5 py-0.5 text-sm text-text-primary hover:bg-surface-hover cursor-pointer"
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
          'flex w-[380px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-lg p-4',
          'pointer-events-auto font-sans',
          getToastSurfaceClasses(variant),
          className
        )}
        {...ariaProps}
        role={role}
      >
        <ToastIcon variant={variant} customIcon={customIcon} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-sm font-semibold leading-snug text-text-primary">{title}</p>
          {subtitle ? (
            <p className="mt-1 mb-0 text-sm leading-snug text-text-secondary">{subtitle}</p>
          ) : null}
          {actions?.map(action => (
            <ActionChip key={action.label} action={action} />
          ))}
        </div>
        {onDismiss ? (
          <button
            type="button"
            aria-label="Dismiss"
            className="shrink-0 -mr-1 -mt-0.5 flex h-7 w-7 items-center justify-center rounded-md border-0 bg-transparent p-0 text-text-tertiary hover:text-text-secondary cursor-pointer"
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

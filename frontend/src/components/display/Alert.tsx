/**
 * Alert — inline notice with toast-like layout and badge surface (no gradient).
 */

import React, { type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/primitives/Icon';
import { getColorStyles } from '@/components/primitives/badgeHelpers';
import type { BadgeColor } from '@/components/primitives/badgeHelpers';
import { getBadgeAppearance } from '@/components/theme/theme';
import { cn } from '@/utils';

interface AlertProps {
  children?: ReactNode;
  /** Title line (toast-style); use with `description` for two-line alerts */
  title?: string;
  description?: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  onClose?: () => void;
  className?: string;
}

const VARIANT_COLOR: Record<NonNullable<AlertProps['variant']>, BadgeColor> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

const ALERT_ICON_NAME: Record<NonNullable<AlertProps['variant']>, IconName> = {
  info: 'info-circle',
  success: 'check-circle',
  warning: 'warning',
  danger: 'alert-circle',
};

function getAlertShellClasses(variant: NonNullable<AlertProps['variant']>): string {
  const color = VARIANT_COLOR[variant];
  const appearance = getBadgeAppearance();
  if (appearance === 'tinted') {
    return cn(getColorStyles(color, 'tinted').className, 'shadow-sm');
  }
  return 'bg-badge border border-border-default shadow-sm';
}

function getAlertIconClasses(variant: NonNullable<AlertProps['variant']>): string {
  const color = VARIANT_COLOR[variant];
  const appearance = getBadgeAppearance();
  if (appearance === 'tinted') {
    return 'text-current';
  }
  return getColorStyles(color, 'unified').className;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  title,
  description,
  variant = 'info',
  onClose,
  className = '',
}) => {
  const appearance = getBadgeAppearance();
  const iconClass = getAlertIconClasses(variant);

  const body =
    title != null ? (
      <div>
        <p
          className={cn(
            'm-0 text-sm font-semibold leading-snug',
            appearance === 'unified' && 'text-text-primary'
          )}
        >
          {title}
        </p>
        {description ? (
          <p
            className={cn(
              'mt-1 mb-0 text-sm leading-snug',
              appearance === 'unified' ? 'text-text-secondary' : 'opacity-90'
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    ) : (
      children
    );

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-[10px] p-4',
        getAlertShellClasses(variant),
        className
      )}
      role="alert"
    >
      <Icon name={ALERT_ICON_NAME[variant]} className={cn('mt-0.5 shrink-0 w-5 h-5', iconClass)} />
      <div className="min-w-0 flex-1">{body}</div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 self-start -mr-1 -mt-0.5 flex h-7 w-7 items-center justify-center rounded-md border-0 bg-transparent p-0 text-text-tertiary hover:text-text-secondary cursor-pointer"
          aria-label="Close alert"
        >
          <Icon name="cross" className="w-4 h-4 pointer-events-none" />
        </button>
      ) : null}
    </div>
  );
};

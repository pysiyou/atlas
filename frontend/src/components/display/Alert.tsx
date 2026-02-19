/**
 * Alert Component
 * Notification and alert messages
 */

import React, { type ReactNode } from 'react';
import { Icon } from '@/components/primitives/Icon';

interface AlertProps {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  onClose?: () => void;
  className?: string;
}

/**
 * Alert variant styles
 */
const VARIANT_STYLES = {
  info: 'bg-brand-muted border-border-focus text-brand-fg',
  success: 'bg-success-bg border-success-stroke text-success-fg-emphasis',
  warning: 'bg-warning-bg border-warning-stroke text-warning-fg-emphasis',
  danger: 'bg-danger-bg border-danger-stroke text-danger-fg-emphasis',
} as const;

/**
 * Alert variant icons — defined at module level so they are not re-created
 * on every render. Only the selected variant's icon is actually used.
 */
const ALERT_ICONS: Record<NonNullable<AlertProps['variant']>, ReactNode> = {
  info: <Icon name="info-circle" className="w-5 h-5" />,
  success: <Icon name="check-circle" className="w-5 h-5" />,
  warning: <Icon name="warning" className="w-5 h-5" />,
  danger: <Icon name="close-circle" className="w-5 h-5" />,
};

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  onClose,
  className = '',
}) => {
  const icon = ALERT_ICONS[variant];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${VARIANT_STYLES[variant]} ${className}`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
          aria-label="Close alert"
        >
          <Icon name="cross" className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

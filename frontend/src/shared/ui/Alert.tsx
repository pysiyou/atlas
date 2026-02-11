/**
 * Alert Component
 * Notification and alert messages
 */

import React, { type ReactNode } from 'react';
import { Icon } from './Icon';
import { ICONS } from '@/utils';

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
  info: 'bg-brand-muted border-stroke-focus text-brand-fg',
  success: 'bg-success-bg border-success-stroke text-success-fg-emphasis',
  warning: 'bg-warning-bg border-warning-stroke text-warning-fg-emphasis',
  danger: 'bg-danger-bg border-danger-stroke text-danger-fg-emphasis',
};

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  onClose,
  className = '',
}) => {
  const icons = {
    info: <Icon name={ICONS.actions.infoCircle} className="w-5 h-5" />,
    success: <Icon name={ICONS.actions.checkCircle} className="w-5 h-5" />,
    warning: <Icon name={ICONS.actions.warning} className="w-5 h-5" />,
    danger: <Icon name={ICONS.actions.closeCircle} className="w-5 h-5" />,
  };
  const icon = icons[variant];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${VARIANT_STYLES[variant]} ${className}`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
          aria-label="Close alert"
        >
          <Icon name={ICONS.actions.cross} className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

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
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  danger: 'bg-red-50 border-red-200 text-red-800',
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

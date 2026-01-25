/**
 * Alert Component
 * Notification and alert messages
 */

import React, { type ReactNode } from 'react';
import { Icon } from './Icon';
import { ICONS } from '@/utils/icon-mappings';
import { getAlertClasses } from '@/shared/design-system/tokens/components/alert';

interface AlertProps {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  onClose,
  className = '',
}) => {
  // Colors match Badge component for visual consistency - uses design tokens
  const icons = {
    info: <Icon name={ICONS.actions.infoCircle} className="w-5 h-5" />,
    success: <Icon name={ICONS.actions.checkCircle} className="w-5 h-5" />,
    warning: <Icon name={ICONS.actions.warning} className="w-5 h-5" />,
    danger: <Icon name={ICONS.actions.closeCircle} className="w-5 h-5" />,
  };
  const icon = icons[variant];

  return (
    <div
      className={`${getAlertClasses(variant)} ${className}`}
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

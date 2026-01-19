/**
 * Alert Component
 * Notification and alert messages
 */

import React, { type ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

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
  // Colors match Badge component for visual consistency
  const variants = {
    info: {
      bg: 'bg-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <Info size={20} />,
    },
    success: {
      bg: 'bg-green-100',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle size={20} />,
    },
    warning: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: <AlertCircle size={20} />,
    },
    danger: {
      bg: 'bg-red-100',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <XCircle size={20} />,
    },
  };
  
  const { bg, border, text, icon } = variants[variant];
  
  return (
    <div
      className={`${bg} ${border} ${text} border rounded p-4 flex items-start gap-3 ${className}`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Close alert"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
};

/**
 * Button Component
 * Rectangular button with optional icon - used for actions, form submissions, etc.
 */

import React, { type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  outline: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:ring-gray-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const iconSizes: Record<ButtonSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const spinnerSizes: Record<ButtonSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  const widthClass = fullWidth ? 'w-full' : '';

  const renderIcon = (iconElement: React.ReactNode) => {
    if (React.isValidElement(iconElement)) {
      return React.cloneElement(iconElement as React.ReactElement<{ className?: string }>, {
        className: iconSizes[size],
      });
    }
    return iconElement;
  };

  const content = isLoading ? (
    <span className="flex items-center justify-center gap-1.5">
      <svg className={`animate-spin ${spinnerSizes[size]}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {children && <span>Loading...</span>}
    </span>
  ) : (
    <span className="flex items-center justify-center gap-1.5">
      {icon && iconPosition === 'left' && renderIcon(icon)}
      {children}
      {icon && iconPosition === 'right' && renderIcon(icon)}
    </span>
  );

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {content}
    </button>
  );
};

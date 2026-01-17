/**
 * IconButton Component
 * Fully rounded button with icon only - used for close buttons, action icons, etc.
 */

import React, { forwardRef, memo, type ButtonHTMLAttributes } from 'react';

type IconButtonVariant = 'primary' | 'success' | 'danger' | 'warning' | 'secondary';
type IconButtonSize = 'xs' | 'sm' | 'md';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

const variantClasses: Record<IconButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
};

const sizeClasses: Record<IconButtonSize, string> = {
  xs: 'p-1',
  sm: 'p-1.5',
  md: 'p-2',
};

const iconSizeClasses: Record<IconButtonSize, string> = {
  xs: '[&_svg]:w-3 [&_svg]:h-3 [&>span]:w-3 [&>span]:h-3',
  sm: '[&_svg]:w-4 [&_svg]:h-4 [&>span]:w-4 [&>span]:h-4',
  md: '[&_svg]:w-5 [&_svg]:h-5 [&>span]:w-5 [&>span]:h-5',
};

export const IconButton = memo(
  forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ icon, variant = 'primary', size = 'md', className = '', disabled, ...props }, ref) => {
      return (
        <button
          ref={ref}
          disabled={disabled}
          className={`
            ${variantClasses[variant]}
            ${sizeClasses[size]}
            ${iconSizeClasses[size]}
            rounded-full
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:scale-105 active:scale-95
            flex items-center justify-center
            cursor-pointer
            ${className}
          `}
          {...props}
        >
          {icon}
        </button>
      );
    }
  )
);

IconButton.displayName = 'IconButton';

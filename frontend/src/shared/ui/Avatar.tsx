import React, { useState } from 'react';
import { getInitials } from '@/utils';

export interface AvatarProps {
  primaryText: string;
  src?: string;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  secondaryText?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  primaryText, 
  src, 
  size = 'md', 
  className = '',
  onClick,
  secondaryText
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xxs: 'w-6 h-6 text-[8px]',
    xs: 'w-7 h-7 text-[8px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-14 h-14 text-lg'
  };

  const textSizeClasses = {
    xxs: {
      primary: 'text-xxs',
      secondary: 'text-[10px]'
    },
    xs: {
      primary: 'text-xs',
      secondary: 'text-[10px]'
    },
    sm: {
      primary: 'text-sm',
      secondary: 'text-xxs'
    },
    md: {
      primary: 'text-base',
      secondary: 'text-xs'
    },
    lg: {
      primary: 'text-lg',
      secondary: 'text-sm'
    },
    xl: {
      primary: 'text-xl',
      secondary: 'text-base'
    }
  };

  const Container = onClick ? 'button' : 'div';
  const hasText = primaryText;

  return (
    <Container
      className={`relative flex items-center ${hasText ? 'gap-3 max-w-full' : 'justify-center'} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Avatar circle */}
      {src && !imageError ? (
        <img
          src={src}
          alt={primaryText}
          className={`rounded object-cover block shrink-0 ${sizeClasses[size]}`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className={`rounded bg-sky-600 flex items-center justify-center text-white font-semibold shrink-0 ${sizeClasses[size]}`}
        >
          {getInitials(primaryText)}
        </div>
      )}
      
      {/* Primary and secondary text */}
      {hasText && (
        <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
          <div className={`font-medium text-gray-900 truncate ${textSizeClasses[size].primary}`}>
            {primaryText}
          </div>
          {secondaryText && (
            <div className={`text-gray-500 truncate ${textSizeClasses[size].secondary}`}>
              {secondaryText}
            </div>
          )}
        </div>
      )}
    </Container>
  );
};

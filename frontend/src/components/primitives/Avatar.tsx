import React, { useState } from 'react';
import { getInitials } from '@/utils';

export interface AvatarProps {
  primaryText: string;
  src?: string;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  secondaryText?: string;
  /** Optional className for secondary text */
  secondaryTextClassName?: string;
  /** Optional className for primary text */
  primaryTextClassName?: string;
  /** If true, only shows the avatar circle without text labels */
  avatarOnly?: boolean;
}

type AvatarSize = NonNullable<AvatarProps['size']>;

// Module-level constants: do not re-create these objects on every render.
const CIRCLE_SIZE_CLASSES: Record<AvatarSize, string> = {
  xxs: 'w-6 h-6 text-[8px]',
  xs: 'w-7 h-7 text-[8px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-14 h-14 text-lg',
};

const LABEL_SIZE_CLASSES: Record<AvatarSize, { primary: string; secondary: string }> = {
  xxs: { primary: 'text-xxs', secondary: 'text-xxs' },
  xs: { primary: 'text-xs', secondary: 'text-xxs' },
  sm: { primary: 'text-sm', secondary: 'text-xxs' },
  md: { primary: 'text-base', secondary: 'text-xs' },
  lg: { primary: 'text-lg', secondary: 'text-sm' },
  xl: { primary: 'text-xl', secondary: 'text-base' },
};

export const Avatar: React.FC<AvatarProps> = ({
  primaryText,
  src,
  size = 'md',
  className = '',
  onClick,
  secondaryText,
  secondaryTextClassName = '',
  primaryTextClassName = '',
  avatarOnly = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const isButton = Boolean(onClick);
  const hasText = primaryText && !avatarOnly;
  const labelSizes = LABEL_SIZE_CLASSES[size];

  return (
    <div
      role={isButton ? 'button' : undefined}
      tabIndex={isButton ? 0 : undefined}
      className={`relative flex items-center ${hasText ? 'gap-3 max-w-full' : 'justify-center'} ${isButton ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      onKeyDown={isButton ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); } : undefined}
    >
      {/* Avatar circle */}
      {src && !imageError ? (
        <img
          src={src}
          alt={primaryText}
          className={`rounded object-cover block shrink-0 ${CIRCLE_SIZE_CLASSES[size]}`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className={`rounded bg-brand flex items-center justify-center text-on-brand font-normal shrink-0 ${CIRCLE_SIZE_CLASSES[size]}`}
        >
          {getInitials(primaryText)}
        </div>
      )}

      {/* Optional text labels */}
      {hasText && (
        <div className="flex flex-col min-w-0">
          <span
            className={`font-medium text-text-primary truncate ${labelSizes.primary} ${primaryTextClassName}`}
          >
            {primaryText}
          </span>
          {secondaryText && (
            <span
              className={`text-text-tertiary truncate ${labelSizes.secondary} ${secondaryTextClassName || ''}`}
            >
              {secondaryText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

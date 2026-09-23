import React, { useState } from 'react';
import { AVATAR_TYPE, RADIUS } from '@/components/theme/recipes';
import { cn, getInitials } from '@/utils';
import { isEntityIdClassName } from '@/utils/constants';

export interface AvatarProps {
  primaryText: string;
  src?: string;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  secondaryText?: React.ReactNode;
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
  xxs: `w-6 h-6 ${AVATAR_TYPE.circle.xxs}`,
  xs: `w-7 h-7 ${AVATAR_TYPE.circle.xs}`,
  sm: `w-8 h-8 ${AVATAR_TYPE.circle.sm}`,
  md: `w-10 h-10 ${AVATAR_TYPE.circle.md}`,
  lg: `w-12 h-12 ${AVATAR_TYPE.circle.lg}`,
  xl: `w-14 h-14 ${AVATAR_TYPE.circle.xl}`,
};

const LABEL_SIZE_CLASSES: Record<AvatarSize, { primary: string; secondary: string }> = {
  xxs: { primary: AVATAR_TYPE.primary.xxs, secondary: AVATAR_TYPE.secondary.xxs },
  xs: { primary: AVATAR_TYPE.primary.xs, secondary: AVATAR_TYPE.secondary.xs },
  sm: { primary: AVATAR_TYPE.primary.sm, secondary: AVATAR_TYPE.secondary.sm },
  md: { primary: AVATAR_TYPE.primary.md, secondary: AVATAR_TYPE.secondary.md },
  lg: { primary: AVATAR_TYPE.primary.lg, secondary: AVATAR_TYPE.secondary.lg },
  xl: { primary: AVATAR_TYPE.primary.xl, secondary: AVATAR_TYPE.secondary.xl },
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
  const secondaryUsesEntityId = isEntityIdClassName(secondaryTextClassName);

  return (
    <div
      role={isButton ? 'button' : undefined}
      tabIndex={isButton ? 0 : undefined}
      className={`relative flex items-center ${hasText ? 'gap-space-3 max-w-full' : 'justify-center'} ${isButton ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      onKeyDown={isButton ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); } : undefined}
    >
      {/* Avatar circle */}
      {src && !imageError ? (
        <img
          src={src}
          alt={primaryText}
          className={`${RADIUS.pill} object-cover block shrink-0 ${CIRCLE_SIZE_CLASSES[size]}`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className={`${RADIUS.pill} bg-brand flex items-center justify-center text-on-brand font-normal shrink-0 ${CIRCLE_SIZE_CLASSES[size]}`}
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
              className={cn(
                'truncate',
                labelSizes.secondary,
                secondaryUsesEntityId
                  ? secondaryTextClassName
                  : cn('text-text-tertiary', secondaryTextClassName)
              )}
            >
              {secondaryText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

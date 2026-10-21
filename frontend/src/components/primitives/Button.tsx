/**
 * Button + IconButton (single module).
 * Adjust sizes in iconButtonIconSize / labelIconSize; colors in tone.
 */

import React, { forwardRef, memo, type ButtonHTMLAttributes } from 'react';
import { SpinnerLoader } from '@/components/loaders/SpinnerLoader';
import { ICON_SIZE, iconButton as iconButtonRecipe, labelButton as labelButtonRecipe } from '@/theme/recipes';
import { cn } from '@/utils/cn';
import { Icon, type IconName } from './Icon';

export type BaseVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'outline'
  | 'warning'
  | 'ghost';

export type ButtonVariant = BaseVariant;
export type IconButtonVariant = BaseVariant;
export type ButtonSize = 'sm' | 'md' | 'lg';
export type IconButtonSize = ButtonSize;
export type ButtonLayout = 'text' | 'icon-text';
export type IconButtonShape = 'circle' | 'square';

const labelIconSize: Record<ButtonSize, string> = {
  sm: ICON_SIZE.labelIcon.sm,
  md: ICON_SIZE.labelIcon.md,
  lg: ICON_SIZE.labelIcon.lg,
};

const iconButtonIconSize: Record<ButtonSize, string> = {
  sm: ICON_SIZE.xs,
  md: ICON_SIZE.sm,
  lg: ICON_SIZE.md,
};

function labelButtonClasses(
  variant: BaseVariant,
  size: ButtonSize,
  fullWidth?: boolean,
  className?: string
): string {
  return cn(
    labelButtonRecipe({ intent: variant, size, fullWidth: fullWidth ? true : false }),
    className
  );
}

function iconButtonClasses(
  variant: BaseVariant,
  size: ButtonSize,
  shape: IconButtonShape,
  className?: string
): string {
  return cn(iconButtonRecipe({ intent: variant, size, shape }), className);
}

function resolveLayout(
  layout: ButtonLayout | undefined,
  icon: React.ReactNode | undefined,
  iconName: IconName | undefined
): ButtonLayout {
  if (layout) return layout;
  if (icon != null || iconName != null) return 'icon-text';
  return 'text';
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  layout?: ButtonLayout;
  icon?: React.ReactNode;
  iconName?: IconName;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  isLoading?: boolean;
  showTextWhenLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  layout,
  icon,
  iconName,
  iconPosition = 'left',
  fullWidth = false,
  isLoading = false,
  showTextWhenLoading = false,
  className,
  disabled,
  ...props
}) => {
  const withIcon = resolveLayout(layout, icon, iconName) === 'icon-text';
  const shouldRenderIcon = withIcon && (icon != null || iconName != null);
  const iconClass = labelIconSize[size];

  const renderIcon = (): React.ReactNode => {
    if (!shouldRenderIcon) return null;
    if (icon && React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
        className: cn(iconClass, (icon as React.ReactElement<{ className?: string }>).props.className),
      });
    }
    if (icon) return icon;
    if (iconName) return <Icon name={iconName} className={iconClass} />;
    return null;
  };

  const iconEl = shouldRenderIcon ? (
    <span className={cn('inline-flex shrink-0 items-center justify-center', iconClass)}>{renderIcon()}</span>
  ) : null;

  const label = (
    <>
      {iconPosition === 'left' && iconEl}
      {children}
      {iconPosition === 'right' && iconEl}
    </>
  );

  let body: React.ReactNode = label;
  if (isLoading) {
    const spinner = <SpinnerLoader size="xs" />;
    body = showTextWhenLoading ? (
      <span className="inline-flex items-center gap-space-1-5">
        {spinner}
        {children}
      </span>
    ) : (
      <span className={cn('grid *:col-start-1 *:row-start-1', fullWidth && 'w-full')}>
        <span
          className={cn('inline-flex items-center gap-space-1-5 invisible', fullWidth && 'w-full')}
          aria-hidden
        >
          {label}
        </span>
        <span className={cn('inline-flex items-center justify-center', fullWidth && 'w-full')}>{spinner}</span>
      </span>
    );
  }

  return (
    <button
      className={labelButtonClasses(variant, size, fullWidth, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {body}
    </button>
  );
};

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon?: React.ReactNode;
  iconName?: IconName;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: IconButtonShape;
}

export const IconButton = memo(
  forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ icon, iconName, variant = 'primary', size = 'md', shape = 'circle', className, disabled, ...props }, ref) => {
      const iconClass = iconButtonIconSize[size];

      let content: React.ReactNode = null;
      if (icon && React.isValidElement(icon)) {
        content = React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: cn(iconClass, (icon as React.ReactElement<{ className?: string }>).props.className),
        });
      } else if (icon) {
        content = icon;
      } else if (iconName) {
        content = <Icon name={iconName} className={iconClass} />;
      }

      return (
        <button
          ref={ref}
          disabled={disabled}
          className={iconButtonClasses(variant, size, shape, className)}
          {...props}
        >
          {content}
        </button>
      );
    }
  )
);

IconButton.displayName = 'IconButton';

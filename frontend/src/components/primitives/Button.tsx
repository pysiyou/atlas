/**
 * Button + IconButton (single module).
 * Adjust sizes in iconButtonIconSize / labelIconSize; colors in tone.
 */

import React, { forwardRef, memo, type ButtonHTMLAttributes } from 'react';
import { SpinnerLoader } from '@/components/loaders/SpinnerLoader';
import { CONTROL, RADIUS } from '@/components/theme/recipes';
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

const chrome =
  `inline-flex shrink-0 items-center justify-center font-normal whitespace-nowrap overflow-hidden cursor-pointer transition-colors duration-200 ${CONTROL.focusVisible} disabled:opacity-50 disabled:cursor-not-allowed`;

const tone: Record<BaseVariant, string> = {
  primary: 'bg-brand text-on-brand hover:bg-brand-hover focus-visible:ring-brand',
  secondary: 'bg-surface-hover text-text-primary hover:bg-border-subtle focus-visible:ring-text-muted',
  danger: 'bg-danger text-on-danger hover:bg-danger-hover focus-visible:ring-danger',
  success: 'bg-success text-on-success hover:bg-success-hover focus-visible:ring-success',
  warning: 'bg-warning text-on-warning hover:bg-warning-hover focus-visible:ring-warning',
  outline:
    'border-2 border-border-strong bg-transparent text-text-secondary hover:bg-surface-hover focus-visible:ring-text-muted',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-hover focus-visible:ring-text-muted',
};

const labelButtonSize: Record<ButtonSize, string> = {
  sm: `gap-space-1-5 px-space-3 py-space-1-5 text-xs ${RADIUS.button}`,
  md: `gap-space-1-5 px-space-4 py-space-2 text-sm ${RADIUS.button}`,
  lg: `gap-space-1-5 px-table-cell-x-default py-space-3 text-base ${RADIUS.button}`,
};

const labelIconSize: Record<ButtonSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const iconButtonBox: Record<ButtonSize, string> = {
  sm: 'size-7',
  md: 'size-8',
  lg: 'size-10',
};

const iconButtonIconSize: Record<ButtonSize, string> = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

const iconButtonShape: Record<IconButtonShape, string> = {
  circle: RADIUS.buttonCircle,
  square: RADIUS.buttonSquare,
};

function labelButtonClasses(
  variant: BaseVariant,
  size: ButtonSize,
  fullWidth?: boolean,
  className?: string
): string {
  return cn(chrome, tone[variant], labelButtonSize[size], fullWidth && 'w-full', className);
}

function iconButtonClasses(
  variant: BaseVariant,
  size: ButtonSize,
  shape: IconButtonShape,
  className?: string
): string {
  return cn(chrome, tone[variant], iconButtonBox[size], iconButtonShape[shape], className);
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

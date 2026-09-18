/**
 * Button + IconButton (single module).
 * Adjust sizes in iconButtonIconSize / labelIconSize; colors in tone.
 */

import React, { forwardRef, memo, type ButtonHTMLAttributes } from 'react';
import { ICONS, MODULE_ICONS } from '@/config/icons';
import { SpinnerLoader } from '@/components/loaders/SpinnerLoader';
import { RADIUS } from '@/components/theme/recipes';
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

export type SemanticVariant =
  | 'save'
  | 'cancel'
  | 'delete'
  | 'reject'
  | 'approve'
  | 'collect'
  | 'edit'
  | 'add'
  | 'create'
  | 'close'
  | 'next'
  | 'previous'
  | 'submit'
  | 'retry'
  | 'print'
  | 'view'
  | 'download'
  | 'filter'
  | 'search'
  | 'refresh'
  | 'back'
  | 'logout'
  | 'remove'
  | 'home'
  | 'confirm'
  | 'expand'
  | 'collapse'
  | 'sidebarClose'
  | 'menu';

export type ButtonLikeVariant = BaseVariant | SemanticVariant;
export type ButtonVariant = ButtonLikeVariant;
export type IconButtonVariant = ButtonLikeVariant;
export type ButtonSize = 'sm' | 'md' | 'lg';
export type IconButtonSize = ButtonSize;
export type ButtonLayout = 'text' | 'icon-text';
export type IconButtonShape = 'circle' | 'square';

const SEMANTIC_VARIANTS: Record<SemanticVariant, { style: BaseVariant; icon: IconName }> = {
  save: { style: 'primary', icon: ICONS.actions.save },
  submit: { style: 'primary', icon: ICONS.actions.check },
  approve: { style: 'success', icon: ICONS.actions.like },
  collect: { style: 'primary', icon: MODULE_ICONS.laboratory },
  confirm: { style: 'success', icon: ICONS.actions.check },
  add: { style: 'primary', icon: ICONS.actions.add },
  create: { style: 'primary', icon: ICONS.actions.add },
  edit: { style: 'primary', icon: ICONS.actions.edit },
  cancel: { style: 'outline', icon: ICONS.actions.cross },
  close: { style: 'ghost', icon: ICONS.actions.cross },
  back: { style: 'outline', icon: ICONS.actions.arrowLeft },
  previous: { style: 'outline', icon: ICONS.actions.chevronLeft },
  next: { style: 'primary', icon: ICONS.actions.chevronRight },
  home: { style: 'primary', icon: ICONS.actions.home },
  expand: { style: 'secondary', icon: ICONS.actions.chevronDown },
  collapse: { style: 'secondary', icon: ICONS.actions.chevronLeft },
  sidebarClose: { style: 'ghost', icon: ICONS.actions.doubleArrowLeft },
  menu: { style: 'primary', icon: ICONS.actions.menuDots },
  delete: { style: 'danger', icon: ICONS.actions.delete },
  reject: { style: 'danger', icon: ICONS.actions.dislike },
  retry: { style: 'primary', icon: ICONS.actions.loading },
  refresh: { style: 'secondary', icon: ICONS.actions.loading },
  print: { style: 'secondary', icon: ICONS.actions.printer },
  view: { style: 'secondary', icon: ICONS.actions.view },
  download: { style: 'secondary', icon: ICONS.actions.download },
  filter: { style: 'primary', icon: ICONS.actions.filter },
  search: { style: 'primary', icon: ICONS.actions.search },
  logout: { style: 'danger', icon: ICONS.actions.logout },
  remove: { style: 'danger', icon: ICONS.actions.cross },
};

function baseTone(variant: ButtonLikeVariant): BaseVariant {
  if (variant in SEMANTIC_VARIANTS) {
    return SEMANTIC_VARIANTS[variant as SemanticVariant].style;
  }
  return variant as BaseVariant;
}

function defaultIcon(variant: ButtonLikeVariant): IconName | undefined {
  if (variant in SEMANTIC_VARIANTS) {
    return SEMANTIC_VARIANTS[variant as SemanticVariant].icon;
  }
  return undefined;
}

const chrome =
  'inline-flex shrink-0 items-center justify-center font-normal whitespace-nowrap overflow-hidden cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

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
  sm: `gap-1.5 px-3 py-1.5 text-xs ${RADIUS.button}`,
  md: `gap-1.5 px-4 py-2 text-sm ${RADIUS.button}`,
  lg: `gap-1.5 px-6 py-3 text-base ${RADIUS.button}`,
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
  variant: ButtonLikeVariant,
  size: ButtonSize,
  fullWidth?: boolean,
  className?: string
): string {
  return cn(chrome, tone[baseTone(variant)], labelButtonSize[size], fullWidth && 'w-full', className);
}

function iconButtonClasses(
  variant: ButtonLikeVariant,
  size: ButtonSize,
  shape: IconButtonShape,
  className?: string
): string {
  let colors = tone[baseTone(variant)];
  if (variant === 'close') colors = tone.danger;
  if (variant === 'sidebarClose') {
    colors = 'bg-surface-hover text-text-secondary hover:bg-border-subtle focus-visible:ring-text-muted';
  }
  return cn(chrome, colors, iconButtonBox[size], iconButtonShape[shape], className);
}

function resolveLayout(
  layout: ButtonLayout | undefined,
  variant: ButtonLikeVariant,
  icon: React.ReactNode | undefined
): ButtonLayout {
  if (layout) return layout;
  if (icon != null || defaultIcon(variant)) return 'icon-text';
  return 'text';
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  layout?: ButtonLayout;
  icon?: React.ReactNode;
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
  iconPosition = 'left',
  fullWidth = false,
  isLoading = false,
  showTextWhenLoading = false,
  className,
  disabled,
  ...props
}) => {
  const resolvedVariant = variant as ButtonLikeVariant;
  const withIcon = resolveLayout(layout, resolvedVariant, icon) === 'icon-text';
  const iconName = withIcon ? defaultIcon(resolvedVariant) : undefined;
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
      <span className="inline-flex items-center gap-1.5">
        {spinner}
        {children}
      </span>
    ) : (
      <span className={cn('grid *:col-start-1 *:row-start-1', fullWidth && 'w-full')}>
        <span
          className={cn('inline-flex items-center gap-1.5 invisible', fullWidth && 'w-full')}
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
      className={labelButtonClasses(resolvedVariant, size, fullWidth, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {body}
    </button>
  );
};

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon?: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: IconButtonShape;
}

export const IconButton = memo(
  forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ icon, variant = 'primary', size = 'md', shape = 'circle', className, disabled, ...props }, ref) => {
      const resolvedVariant = variant as ButtonLikeVariant;
      const iconClass = iconButtonIconSize[size];
      const iconName = defaultIcon(resolvedVariant);

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
          className={iconButtonClasses(resolvedVariant, size, shape, className)}
          {...props}
        >
          {content}
        </button>
      );
    }
  )
);

IconButton.displayName = 'IconButton';

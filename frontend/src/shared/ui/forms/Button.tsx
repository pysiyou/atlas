/**
 * Button Component
 *
 * Rectangular button with semantic variants that bundle icon + styling together.
 * Used for actions, form submissions, etc.
 *
 * Usage:
 *   <Button variant="save">Save</Button>           // Shows save icon + primary style
 *   <Button variant="cancel">Cancel</Button>       // Shows cross icon + outline style
 *   <Button variant="save" showIcon={false}>Save</Button>  // No icon, just primary style
 *   <Button variant="primary">Custom</Button>      // Base style, no default icon
 */

import React, { type ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../display/Icon';
import { ICONS } from '@/utils';

/**
 * Base style variants (no default icon)
 */
type BaseVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'warning';


type SemanticVariant =
  | 'save'
  | 'cancel'
  | 'delete'
  | 'reject'
  | 'approve'
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
  | 'remove';

/**
 * All available button variants
 */
export type ButtonVariant = BaseVariant | SemanticVariant;

/**
 * Available button sizes
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Configuration for semantic variants
 */
interface VariantConfig {
  /** Base style to apply */
  style: BaseVariant;
  /** Default icon name */
  icon: IconName;
}

/**
 * Maps semantic variants to their style and icon configuration
 */
const VARIANT_CONFIG: Record<SemanticVariant, VariantConfig> = {
  // Primary actions
  save: { style: 'primary', icon: ICONS.actions.save },
  submit: { style: 'primary', icon: ICONS.actions.check },
  approve: { style: 'success', icon: ICONS.actions.check },
  add: { style: 'primary', icon: ICONS.actions.add },
  create: { style: 'primary', icon: ICONS.actions.add },
  edit: { style: 'primary', icon: ICONS.actions.edit },

  // Secondary/Navigation actions
  cancel: { style: 'danger', icon: ICONS.actions.cross },
  close: { style: 'danger', icon: ICONS.actions.cross },
  back: { style: 'outline', icon: ICONS.actions.arrowLeft },
  previous: { style: 'outline', icon: ICONS.actions.chevronLeft },
  next: { style: 'primary', icon: ICONS.actions.chevronRight },

  // Destructive actions
  delete: { style: 'danger', icon: ICONS.actions.delete },
  reject: { style: 'danger', icon: ICONS.actions.delete },

  // Utility actions
  retry: { style: 'primary', icon: ICONS.actions.loading },
  refresh: { style: 'secondary', icon: ICONS.actions.loading },
  print: { style: 'secondary', icon: ICONS.actions.printer },
  view: { style: 'secondary', icon: ICONS.actions.view },
  download: { style: 'secondary', icon: ICONS.actions.download },
  filter: { style: 'primary', icon: ICONS.actions.filter },
  search: { style: 'primary', icon: ICONS.actions.search },

  // User actions
  logout: { style: 'danger', icon: ICONS.actions.logout },

  // Item actions
  remove: { style: 'danger', icon: ICONS.actions.cross },
};

/**
 * Base classes applied to all buttons
 */
const BASE_CLASSES = 'inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded whitespace-nowrap';

/**
 * Base style classes for each variant
 */
const BASE_STYLES: Record<BaseVariant, string> = {
  primary: 'bg-action-primary text-action-primary-on hover:opacity-90 focus:ring-action-primary',
  secondary: 'bg-action-secondary-bg text-action-secondary-text hover:bg-action-secondary-bg-hover focus:ring-neutral-500',
  danger: 'bg-action-danger text-action-danger-on hover:opacity-90 focus:ring-action-danger',
  success: 'bg-action-success text-action-success-on hover:opacity-90 focus:ring-action-success',
  warning: 'bg-action-warning text-action-warning-on hover:opacity-90 focus:ring-action-warning',
  outline: 'border-2 border-border-strong bg-transparent text-text-secondary hover:bg-surface-hover focus:ring-neutral-500',
};

/**
 * Size-specific padding and text classes
 */
const SIZE_STYLES: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

/**
 * Icon size classes based on button size
 */
const ICON_SIZES: Record<ButtonSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

/**
 * Spinner size classes for loading state
 */
const SPINNER_SIZES: Record<ButtonSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 h-5',
};

/**
 * Check if a variant is a semantic variant (has bundled icon)
 */
const isSemanticVariant = (variant: ButtonVariant): variant is SemanticVariant => {
  return variant in VARIANT_CONFIG;
};

/**
 * Get the base style for a variant
 */
const getBaseStyle = (variant: ButtonVariant): BaseVariant => {
  if (isSemanticVariant(variant)) {
    return VARIANT_CONFIG[variant].style;
  }
  return variant;
};

/**
 * Get the default icon for a variant (if any)
 */
const getDefaultIcon = (variant: ButtonVariant): IconName | undefined => {
  if (isSemanticVariant(variant)) {
    return VARIANT_CONFIG[variant].icon;
  }
  return undefined;
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant - can be a base style or semantic action */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Custom icon to override default (or add icon to base variants) */
  icon?: React.ReactNode;
  /** Position of the icon relative to text */
  iconPosition?: 'left' | 'right';
  /** Whether to show the default icon for semantic variants (default: true) */
  showIcon?: boolean;
  /** Whether button should take full width of container */
  fullWidth?: boolean;
  /** Whether button is in loading state */
  isLoading?: boolean;
}

/**
 * Button Component
 *
 * Renders a button with semantic variants that bundle icon + styling.
 * Supports both base style variants and semantic action variants.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  showIcon = true,
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  // Determine the actual style to apply
  const baseStyle = getBaseStyle(variant);

  // Determine which icon to render (custom icon takes precedence)
  const defaultIconName = getDefaultIcon(variant);
  const shouldShowIcon = showIcon && (icon !== undefined || defaultIconName !== undefined);

  // Render the icon element
  const renderIconElement = () => {
    if (!shouldShowIcon) return null;

    // If custom icon provided, use it
    if (icon) {
      if (React.isValidElement(icon)) {
        return React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: ICON_SIZES[size],
        });
      }
      return icon;
    }

    // Otherwise use default icon from variant config
    if (defaultIconName) {
      return <Icon name={defaultIconName} className={ICON_SIZES[size]} />;
    }

    return null;
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const iconWrapperClass = 'inline-flex items-center justify-center shrink-0';

  // Build content based on loading state
  const content = isLoading ? (
    <>
      <span className={iconWrapperClass}>
        <svg
          className={`animate-spin ${SPINNER_SIZES[size]}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </span>
      {children && <span>Loading...</span>}
    </>
  ) : (
    <>
      {iconPosition === 'left' && shouldShowIcon && (
        <span className={iconWrapperClass}>{renderIconElement()}</span>
      )}
      {children}
      {iconPosition === 'right' && shouldShowIcon && (
        <span className={iconWrapperClass}>{renderIconElement()}</span>
      )}
    </>
  );

  return (
    <button
      className={`${BASE_CLASSES} ${BASE_STYLES[baseStyle]} ${SIZE_STYLES[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {content}
    </button>
  );
};

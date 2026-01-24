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
import { Icon, type IconName } from './Icon';

/**
 * Base style variants (no default icon)
 */
type BaseVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'warning';

/**
 * Semantic action variants (bundled icon + style)
 */
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
  save: { style: 'primary', icon: 'save' },
  submit: { style: 'primary', icon: 'check' },
  approve: { style: 'success', icon: 'check' },
  add: { style: 'primary', icon: 'plus' },
  create: { style: 'primary', icon: 'plus' },
  edit: { style: 'primary', icon: 'pen' },

  // Secondary/Navigation actions
  cancel: { style: 'danger', icon: 'cross' },
  close: { style: 'outline', icon: 'cross' },
  back: { style: 'outline', icon: 'arrow-left' },
  previous: { style: 'outline', icon: 'chevron-left' },
  next: { style: 'primary', icon: 'chevron-right' },

  // Destructive actions
  delete: { style: 'danger', icon: 'trash' },
  reject: { style: 'danger', icon: 'trash' },

  // Utility actions
  retry: { style: 'primary', icon: 'loading' },
  refresh: { style: 'secondary', icon: 'loading' },
  print: { style: 'secondary', icon: 'printer' },
  view: { style: 'secondary', icon: 'eye' },
  download: { style: 'secondary', icon: 'download' },
  filter: { style: 'primary', icon: 'filter' },
  search: { style: 'primary', icon: 'search' },

  // User actions
  logout: { style: 'danger', icon: 'log-out' },

  // Item actions
  remove: { style: 'danger', icon: 'cross' },
};

/**
 * Base style classes for each variant
 */
const BASE_STYLES: Record<BaseVariant, string> = {
  primary: 'bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
  outline:
    'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:ring-gray-500',
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

  // Base CSS classes
  const baseClasses =
    'font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  const widthClass = fullWidth ? 'w-full' : '';

  // Build content based on loading state
  const content = isLoading ? (
    <span className="flex items-center justify-center gap-1.5">
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
      {children && <span>Loading...</span>}
    </span>
  ) : (
    <span className="flex items-center justify-center gap-1.5">
      {iconPosition === 'left' && renderIconElement()}
      {children}
      {iconPosition === 'right' && renderIconElement()}
    </span>
  );

  return (
    <button
      className={`${baseClasses} ${BASE_STYLES[baseStyle]} ${SIZE_STYLES[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {content}
    </button>
  );
};

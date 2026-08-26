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
import { SpinnerLoader as DnaHelixLoader, type SpinnerLoaderSize as DnaHelixLoaderSize } from '@/components/loaders/SpinnerLoader';
import {
  type BaseVariant,
  type SemanticVariant,
  VARIANT_CONFIG,
  BASE_STYLES,
  BUTTON_SIZE_STYLES,
  BUTTON_ICON_SIZES,
} from './buttonHelpers';

/**
 * All available button variants (Base + Semantic)
 */
export type ButtonVariant = BaseVariant | SemanticVariant;

/**
 * Available button sizes
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/** Always use smallest loader so it stays inside button; size does not change. */
const BUTTON_LOADER_SIZE: DnaHelixLoaderSize = 'xs';

const BASE_CLASSES =
  'inline-flex shrink-0 items-center justify-center gap-1.5 font-normal transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded whitespace-nowrap overflow-hidden';

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
  /** When true, keep button text visible alongside loader when loading (default: false = loader only) */
  showTextWhenLoading?: boolean;
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
  showTextWhenLoading = false,
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
          className: BUTTON_ICON_SIZES[size],
        });
      }
      return icon;
    }

    // Otherwise use default icon from variant config
    if (defaultIconName) {
      return <Icon name={defaultIconName} className={BUTTON_ICON_SIZES[size]} />;
    }

    return null;
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const iconWrapperClass = `inline-flex items-center justify-center shrink-0 ${BUTTON_ICON_SIZES[size]}`;

  const loaderEl = (
    <span className="inline-flex shrink-0 items-center justify-center">
      <DnaHelixLoader size={BUTTON_LOADER_SIZE} />
    </span>
  );

  const labelContent = (
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

  const content = isLoading ? (
    showTextWhenLoading ? (
      <span className="inline-flex items-center justify-center gap-1.5">
        {loaderEl}
        {children}
      </span>
    ) : (
      <span
        className={`grid *:col-start-1 *:row-start-1 ${fullWidth ? 'w-full' : ''}`}
      >
        <span
          className={`inline-flex items-center justify-center gap-1.5 invisible ${fullWidth ? 'w-full' : ''}`}
          aria-hidden
        >
          {labelContent}
        </span>
        <span
          className={`inline-flex items-center justify-center ${fullWidth ? 'w-full' : ''}`}
        >
          {loaderEl}
        </span>
      </span>
    )
  ) : (
    labelContent
  );

  return (
    <button
      className={`${BASE_CLASSES} ${BASE_STYLES[baseStyle]} ${BUTTON_SIZE_STYLES[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {content}
    </button>
  );
};

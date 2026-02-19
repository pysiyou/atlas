/**
 * IconButton Component
 *
 * Fully rounded button with icon only - used for close buttons, action icons, etc.
 * Supports semantic variants that bundle icon + styling together.
 *
 * Usage:
 *   <IconButton variant="close" />           // Cross icon + danger style
 *   <IconButton variant="approve" />         // Check icon + success style
 *   <IconButton variant="primary" icon={<Icon name="custom" />} />  // Custom icon + primary style
 */

import React, { forwardRef, memo, type ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';
import {
  type BaseVariant,
  type SemanticVariant,
  VARIANT_CONFIG,
  BASE_STYLES,
  ICON_BUTTON_SIZE_STYLES,
  ICON_BUTTON_ICON_SIZES,
} from './buttonHelpers';

/**
 * All available icon button variants (Base + Semantic)
 */
export type IconButtonVariant = BaseVariant | SemanticVariant;

/**
 * Available icon button sizes
 */
export type IconButtonSize = 'xs' | 'sm' | 'md';

/**
 * IconButton-specific variants (for actions like approve, delete, edit, etc.)
 * These override the base style mapped in VARIANT_CONFIG for specific aesthetic tweaks
 * (mainly specialized background/text colors for icon-only buttons).
 */
const ICON_BUTTON_VARIANTS: Record<string, string> = {
  approve: 'bg-success text-on-success hover:opacity-90 focus:ring-success',
  delete: 'bg-danger text-on-danger hover:opacity-90 focus:ring-danger',
  edit: 'bg-brand text-on-brand hover:opacity-90 focus:ring-brand',
  view: 'bg-neutral-200 text-text-primary hover:bg-neutral-300 focus:ring-neutral-500',
  print: 'bg-neutral-200 text-text-primary hover:bg-neutral-300 focus:ring-neutral-500',
  add: 'bg-brand text-on-brand hover:opacity-90 focus:ring-brand',
  sidebarClose: 'bg-surface-hover text-text-secondary hover:opacity-90 focus:ring-neutral-500',
};

/**
 * Check if a variant is a semantic variant (has bundled icon)
 */
const isSemanticVariant = (variant: IconButtonVariant): variant is SemanticVariant => {
  return variant in VARIANT_CONFIG;
};

/**
 * Get the base style for a variant
 */
const getBaseStyle = (variant: IconButtonVariant): BaseVariant => {
  if (isSemanticVariant(variant)) {
    return VARIANT_CONFIG[variant].style;
  }
  return variant;
};

/**
 * Get the default icon for a variant (if any)
 */
const getDefaultIcon = (variant: IconButtonVariant): IconName | undefined => {
  if (isSemanticVariant(variant)) {
    return VARIANT_CONFIG[variant].icon;
  }
  return undefined;
};

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Custom icon to override default (required for base variants) */
  icon?: React.ReactNode;
  /** Button variant - can be a base style or semantic action */
  variant?: IconButtonVariant;
  /** Button size */
  size?: IconButtonSize;
}

/**
 * IconButton Component
 *
 * Renders an icon-only button with semantic variants that bundle icon + styling.
 * For semantic variants, the icon is automatically provided.
 * For base variants, a custom icon must be provided via the icon prop.
 */
export const IconButton = memo(
  forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ icon, variant = 'primary', size = 'md', className = '', disabled, ...props }, ref) => {
      // Determine the actual style to apply
      const baseStyle = getBaseStyle(variant);

      // Check if this is an IconButton-specific variant override, otherwise use shared base style
      const variantStyle =
        variant in ICON_BUTTON_VARIANTS ? ICON_BUTTON_VARIANTS[variant] : BASE_STYLES[baseStyle];

      // Determine which icon to render
      const defaultIconName = getDefaultIcon(variant);

      // Render the icon element
      const renderIconElement = () => {
        // Custom icon takes precedence
        if (icon) {
          return icon;
        }

        // Use default icon from variant config
        if (defaultIconName) {
          return <Icon name={defaultIconName} />;
        }

        // No icon available (shouldn't happen with semantic variants)
        return null;
      };

      return (
        <button
          ref={ref}
          disabled={disabled}
          className={`
            ${variantStyle}
            ${ICON_BUTTON_SIZE_STYLES[size]}
            ${ICON_BUTTON_ICON_SIZES[size]}
            ${variant === 'sidebarClose' ? 'rounded-xl' : 'rounded-full'}
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:scale-105 active:scale-95
            flex items-center justify-center
            cursor-pointer
            ${className}
          `}
          {...props}
        >
          {renderIconElement()}
        </button>
      );
    }
  )
);

IconButton.displayName = 'IconButton';

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
import { ICONS } from '@/utils/icon-mappings';

/**
 * Base style variants (require custom icon)
 */
type BaseVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning';

/**
 * Semantic action variants (bundled icon + style)
 */
type SemanticVariant =
  | 'close'
  | 'confirm'
  | 'approve'
  | 'delete'
  | 'reject'
  | 'remove'
  | 'add'
  | 'edit'
  | 'print'
  | 'view'
  | 'download'
  | 'next'
  | 'previous'
  | 'expand'
  | 'collapse'
  | 'menu'
  | 'search'
  | 'filter'
  | 'refresh'
  | 'save'
  | 'logout';

/**
 * All available icon button variants
 */
export type IconButtonVariant = BaseVariant | SemanticVariant;

/**
 * Available icon button sizes
 */
export type IconButtonSize = 'xs' | 'sm' | 'md';

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
  // Close/Cancel actions
  close: { style: 'danger', icon: ICONS.actions.cross },

  // Confirmation actions
  confirm: { style: 'success', icon: ICONS.actions.check },
  approve: { style: 'success', icon: ICONS.actions.check },
  save: { style: 'primary', icon: ICONS.actions.save },

  // Destructive actions
  delete: { style: 'danger', icon: ICONS.actions.delete },
  reject: { style: 'danger', icon: ICONS.actions.delete },

  // CRUD actions
  add: { style: 'primary', icon: ICONS.actions.add },
  edit: { style: 'primary', icon: ICONS.actions.edit },
  view: { style: 'primary', icon: ICONS.actions.view },

  // Utility actions
  print: { style: 'secondary', icon: ICONS.actions.printer },
  download: { style: 'secondary', icon: ICONS.actions.download },
  search: { style: 'primary', icon: ICONS.actions.search },
  filter: { style: 'secondary', icon: ICONS.actions.filter },
  refresh: { style: 'secondary', icon: ICONS.actions.loading },

  // Navigation actions
  next: { style: 'primary', icon: ICONS.actions.chevronRight },
  previous: { style: 'secondary', icon: ICONS.actions.chevronLeft },
  expand: { style: 'secondary', icon: ICONS.actions.chevronDown },
  collapse: { style: 'secondary', icon: ICONS.actions.chevronLeft },
  menu: { style: 'primary', icon: ICONS.actions.menuDots },

  // User actions
  logout: { style: 'danger', icon: ICONS.actions.logout },

  // Item actions
  remove: { style: 'danger', icon: ICONS.actions.cross },
};

/**
 * Base style classes for each variant
 */
const BASE_STYLES: Record<BaseVariant, string> = {
  primary: 'bg-sky-600 hover:bg-sky-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
};

/**
 * Size-specific padding classes
 */
const SIZE_STYLES: Record<IconButtonSize, string> = {
  xs: 'p-1',
  sm: 'p-1.5',
  md: 'p-2',
};

/**
 * Icon size classes based on button size
 */
const ICON_SIZE_STYLES: Record<IconButtonSize, string> = {
  xs: '[&_svg]:w-3 [&_svg]:h-3 [&>span]:w-3 [&>span]:h-3',
  sm: '[&_svg]:w-4 [&_svg]:h-4 [&>span]:w-4 [&>span]:h-4',
  md: '[&_svg]:w-5 [&_svg]:h-5 [&>span]:w-5 [&>span]:h-5',
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
            ${BASE_STYLES[baseStyle]}
            ${SIZE_STYLES[size]}
            ${ICON_SIZE_STYLES[size]}
            rounded-full
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

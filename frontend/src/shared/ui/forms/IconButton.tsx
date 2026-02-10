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
import { Icon, type IconName } from '../display/Icon';
import { ICONS } from '@/utils';

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
  | 'sidebarClose'
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
  sidebarClose: { style: 'secondary', icon: ICONS.actions.doubleArrowLeft },
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
  primary: 'bg-brand text-on-brand hover:opacity-90 focus:ring-brand',
  secondary: 'bg-neutral-200 text-secondary-fg hover:bg-neutral-300 focus:ring-neutral-500',
  danger: 'bg-danger text-on-danger hover:opacity-90 focus:ring-danger',
  success: 'bg-success text-on-success hover:opacity-90 focus:ring-success',
  warning: 'bg-warning text-on-warning hover:opacity-90 focus:ring-warning',
};

/**
 * IconButton-specific variants (for actions like approve, delete, edit, etc.)
 */
const ICON_BUTTON_VARIANTS: Record<string, string> = {
  approve: 'bg-success text-on-success hover:opacity-90 focus:ring-success',
  delete: 'bg-danger text-on-danger hover:opacity-90 focus:ring-danger',
  edit: 'bg-brand text-on-brand hover:opacity-90 focus:ring-brand',
  view: 'bg-neutral-200 text-secondary-fg hover:bg-neutral-300 focus:ring-neutral-500',
  print: 'bg-neutral-200 text-secondary-fg hover:bg-neutral-300 focus:ring-neutral-500',
  add: 'bg-brand text-on-brand hover:opacity-90 focus:ring-brand',
  sidebarClose:
    'bg-[var(--sidebar-close-bg)] text-[var(--sidebar-close-fg)] hover:opacity-90 focus:ring-neutral-500',
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
      
      // Check if this is an IconButton-specific variant
      const variantStyle = variant in ICON_BUTTON_VARIANTS
        ? ICON_BUTTON_VARIANTS[variant]
        : BASE_STYLES[baseStyle];

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
            ${SIZE_STYLES[size]}
            ${ICON_SIZE_STYLES[size]}
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

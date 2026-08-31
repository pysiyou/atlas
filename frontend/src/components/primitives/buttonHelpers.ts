/**
 * Shared button configuration and styles for Button and IconButton.
 * Components may override base style per variant (e.g. IconButton ICON_BUTTON_VARIANTS).
 */

import { ICONS } from '@/config/icons';
import type { IconName } from './Icon';


/**
 * Base style variants (no default icon)
 */
export type BaseVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'warning';

/**
 * Semantic action variants (bundled icon + style)
 */
export type SemanticVariant =
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
  | 'remove'
  | 'home'
  | 'confirm'
  | 'expand'
  | 'collapse'
  | 'sidebarClose'
  | 'menu';

/**
 * Configuration for semantic variants
 */
export interface VariantConfig {
  /** Base style to apply */
  style: BaseVariant;
  /** Default icon name */
  icon: IconName;
}

/**
 * Maps semantic variants to their style and icon configuration.
 * Union of all semantic variants from Button and IconButton.
 */
export const VARIANT_CONFIG: Record<SemanticVariant, VariantConfig> = {
  // Primary actions
  save: { style: 'primary', icon: ICONS.actions.save },
  submit: { style: 'primary', icon: ICONS.actions.check },
  approve: { style: 'success', icon: ICONS.actions.like },
  confirm: { style: 'success', icon: ICONS.actions.check },
  add: { style: 'primary', icon: ICONS.actions.add },
  create: { style: 'primary', icon: ICONS.actions.add },
  edit: { style: 'primary', icon: ICONS.actions.edit },

  // Secondary/Navigation actions
  cancel: { style: 'danger', icon: ICONS.actions.cross },
  close: { style: 'danger', icon: ICONS.actions.cross },
  back: { style: 'outline', icon: ICONS.actions.arrowLeft },
  previous: { style: 'outline', icon: ICONS.actions.chevronLeft },
  next: { style: 'primary', icon: ICONS.actions.chevronRight },
  home: { style: 'primary', icon: ICONS.actions.home },
  expand: { style: 'secondary', icon: ICONS.actions.chevronDown },
  collapse: { style: 'secondary', icon: ICONS.actions.chevronLeft },
  sidebarClose: { style: 'secondary', icon: ICONS.actions.doubleArrowLeft },
  menu: { style: 'primary', icon: ICONS.actions.menuDots },

  // Destructive actions
  delete: { style: 'danger', icon: ICONS.actions.delete },
  reject: { style: 'danger', icon: ICONS.actions.dislike },

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
 * Base style classes for each variant
 */
export const BASE_STYLES: Record<BaseVariant, string> = {
  primary: 'bg-brand text-on-brand hover:opacity-90 focus:ring-brand',
  secondary: 'bg-neutral-200 text-text-primary hover:bg-neutral-300 focus:ring-neutral-500',
  danger: 'bg-danger text-on-danger hover:opacity-90 focus:ring-danger',
  success: 'bg-success text-on-success hover:opacity-90 focus:ring-success',
  warning: 'bg-warning text-on-warning hover:opacity-90 focus:ring-warning',
  outline:
    'border-2 border-border-strong bg-transparent text-text-secondary hover:bg-surface-hover focus:ring-neutral-500',
};

/**
 * Size-specific padding and text classes (Button)
 */
export const BUTTON_SIZE_STYLES = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

/**
 * Size-specific padding classes (IconButton)
 */
export const ICON_BUTTON_SIZE_STYLES = {
  xs: 'p-1',
  sm: 'p-1.5',
  md: 'p-2',
};

/**
 * Icon size classes based on button size (Button)
 */
export const BUTTON_ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

/**
 * Icon size classes based on button size (IconButton)
 * Uses complex selectors because it might wrap SVGs directly or use spans
 */
export const ICON_BUTTON_ICON_SIZES = {
  xs: '[&_svg]:w-3 [&_svg]:h-3 [&>span]:w-3 [&>span]:h-3',
  sm: '[&_svg]:w-4 [&_svg]:h-4 [&>span]:w-4 [&>span]:h-4',
  md: '[&_svg]:w-5 [&_svg]:h-5 [&>span]:w-5 [&>span]:h-5',
};

/** Union of base + semantic button variants */
export type ButtonLikeVariant = BaseVariant | SemanticVariant;

export const isSemanticVariant = (variant: ButtonLikeVariant): variant is SemanticVariant =>
  variant in VARIANT_CONFIG;

export const getBaseStyle = (variant: ButtonLikeVariant): BaseVariant =>
  isSemanticVariant(variant) ? VARIANT_CONFIG[variant].style : variant;

export const getDefaultIcon = (variant: ButtonLikeVariant): IconName | undefined =>
  isSemanticVariant(variant) ? VARIANT_CONFIG[variant].icon : undefined;

/** Non-text design tokens (icons, avatars). Typography uses `text()` only. */

export const BUTTON_TYPE = {
  sm: 'type-ui-sm',
  md: 'type-ui-md',
  lg: 'type-ui-sm',
} as const;

export const ICON_SIZE = {
  xs: 'size-icon-xs',
  sm: 'size-icon-sm',
  md: 'size-icon-md',
  lg: 'size-icon-lg',
  xl: 'size-icon-xl',
  /** Sidebar nav menu — `w-5 h-5` glyph in chrome nav indicator slot. */
  sidebarNav: {
    icon: 'size-icon-lg',
    slot: 'size-chrome-nav-indicator',
  },
  labelIcon: {
    sm: 'size-icon-sm',
    md: 'size-icon-md',
    lg: 'size-icon-lg',
  },
  iconButtonIcon: {
    sm: 'size-icon-xl',
    md: 'size-[1.75rem]',
    lg: 'size-[2rem]',
  },
} as const;

export const AVATAR_TYPE = {
  circle: {
    xxs: 'type-micro',
    xs: 'type-micro',
    sm: 'type-body',
    md: 'type-ui-md',
    lg: 'type-body',
    xl: 'type-page-title',
  },
  primary: {
    xxs: 'type-caption',
    xs: 'type-body',
    sm: 'type-ui-md',
    md: 'type-body',
    lg: 'type-page-title',
    xl: 'type-page-title',
  },
  secondary: {
    xxs: 'type-caption',
    xs: 'type-caption',
    sm: 'type-caption',
    md: 'type-body',
    lg: 'type-ui-md',
    xl: 'type-body',
  },
} as const;

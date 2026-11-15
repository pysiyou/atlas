/**
 * Main navigation wire data and sidebar motion tokens.
 * Labels resolved in `components/layout/useSidebarMenu.ts` via `getNavCopy()` from `@/strings`.
 */
import { IconKeys, type IconKey } from '@/icons';
import { ROUTES } from '@/app/routes';
import { getClientConfig, isFeatureEnabled } from '@/config';
import type { NavMainKey, NavSettingsLinkKey } from '@/strings';
import type { UserRole } from '@/types';

// =============================================================================
// sidebar-motion
// =============================================================================
export const SIDEBAR_MOTION = {
  width: {
    type: 'spring' as const,
    stiffness: 420,
    damping: 36,
    mass: 0.85,
  },
  label: {
    duration: 0.22,
    ease: [0.4, 0, 0.2, 1] as const,
  },
} as const;

// =============================================================================
// sidebar-menu
// =============================================================================
/** Main nav row — resolve `label` with `getNavCopy().main[stringKey]` in layout. */
export interface NavMenuItemDefinition {
  path: string;
  stringKey: NavMainKey;
  iconKey: IconKey;
  roles: readonly string[];
  featureKey?: string;
}

/** Settings popover row — resolve `label` with `getNavCopy().settingsLinks[stringKey]`. */
export interface SettingsPopoverLinkDefinition {
  stringKey: NavSettingsLinkKey;
  iconKey?: IconKey;
  path?: string;
  disabled?: boolean;
  roles?: UserRole[];
  featureKey?: string;
}

export type SettingsItem = SettingsPopoverLinkDefinition;

export const NAV_MENU_DEFINITIONS: readonly NavMenuItemDefinition[] = [
  {
    path: ROUTES.DASHBOARD,
    stringKey: 'dashboard',
    iconKey: IconKeys.modules.dashboard,
    roles: [],
    featureKey: 'dashboard',
  },
  {
    path: ROUTES.PATIENTS,
    stringKey: 'patients',
    iconKey: IconKeys.modules.patients,
    roles: [],
    featureKey: 'patients',
  },
  {
    path: ROUTES.ORDERS,
    stringKey: 'orders',
    iconKey: IconKeys.modules.orders,
    roles: [],
    featureKey: 'orders',
  },
  {
    path: ROUTES.LABORATORY,
    stringKey: 'laboratory',
    iconKey: IconKeys.modules.laboratory,
    roles: [],
    featureKey: 'laboratory',
  },
  {
    path: ROUTES.LAB_ALL_TESTS,
    stringKey: 'tests',
    iconKey: IconKeys.modules.labTests,
    roles: [],
    featureKey: 'laboratory',
  },
  {
    path: ROUTES.PAYMENTS,
    stringKey: 'payments',
    iconKey: IconKeys.modules.payments,
    roles: [],
    featureKey: 'payments',
  },
  {
    path: ROUTES.REPORTS,
    stringKey: 'reports',
    iconKey: IconKeys.modules.reports,
    roles: [],
    featureKey: 'reports',
  },
  {
    path: ROUTES.CATALOG,
    stringKey: 'catalog',
    iconKey: IconKeys.modules.catalog,
    roles: [],
    featureKey: 'catalog',
  },
  {
    path: ROUTES.EVENT_LOG,
    stringKey: 'audit',
    iconKey: IconKeys.modules.eventLog,
    roles: [],
    featureKey: 'audit',
  },
];

export const SETTINGS_POPOVER_TRIGGER = {
  iconKey: IconKeys.ui.setting,
} as const;

export const SETTINGS_POPOVER_LINK_DEFINITIONS: readonly SettingsPopoverLinkDefinition[] = [
  {
    stringKey: 'users',
    iconKey: IconKeys.modules.users,
    path: ROUTES.USERS,
    roles: ['administrator'],
    featureKey: 'users',
  },
  {
    stringKey: 'notifications',
    iconKey: IconKeys.ui.bell,
    disabled: true,
  },
];

function isNavFeatureEnabled(featureKey: string | undefined): boolean {
  if (!featureKey) return true;
  const config = getClientConfig();
  if (!config?.features) return true;
  return isFeatureEnabled(featureKey);
}

/** Filter nav definitions by feature flags (labels resolved in layout). */
export function getFilteredNavMenuDefinitions(): NavMenuItemDefinition[] {
  return NAV_MENU_DEFINITIONS.filter(item => isNavFeatureEnabled(item.featureKey));
}

export function getFilteredSettingsPopoverLinkDefinitions(
  hasRole: (roles: UserRole | UserRole[]) => boolean,
): SettingsPopoverLinkDefinition[] {
  return SETTINGS_POPOVER_LINK_DEFINITIONS.filter(item => {
    if (!isNavFeatureEnabled(item.featureKey)) return false;
    if (!item.roles || item.roles.length === 0) return true;
    return hasRole(item.roles);
  });
}

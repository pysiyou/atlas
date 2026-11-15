/**
 * App chrome wire data: sidebar menu definitions and motion tokens (no React).
 * Style spec: see config/index.ts. Portal mount: `components/layout/appChromeMount.tsx`.
 */
import { IconKeys, type IconKey } from '../icons';
import { ROUTES } from '../static/routes';
import { getClientConfig, isFeatureEnabled } from './client';
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
/** Main nav row — resolve `label` with `t(terminologyKey, labelFallback)` in layout. */
export interface NavMenuItemDefinition {
  path: string;
  terminologyKey: string;
  labelFallback: string;
  iconKey: IconKey;
  roles: readonly string[];
  featureKey?: string;
}

/** Settings popover row — static `label` unless `terminologyKey` is set. */
export interface SettingsPopoverLinkDefinition {
  label: string;
  terminologyKey?: string;
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
    terminologyKey: 'dashboard',
    labelFallback: 'Dashboard',
    iconKey: IconKeys.modules.dashboard,
    roles: [],
    featureKey: 'dashboard',
  },
  {
    path: ROUTES.PATIENTS,
    terminologyKey: 'patients',
    labelFallback: 'Patients',
    iconKey: IconKeys.modules.patients,
    roles: [],
    featureKey: 'patients',
  },
  {
    path: ROUTES.ORDERS,
    terminologyKey: 'orders',
    labelFallback: 'Orders',
    iconKey: IconKeys.modules.orders,
    roles: [],
    featureKey: 'orders',
  },
  {
    path: ROUTES.LABORATORY,
    terminologyKey: 'laboratory',
    labelFallback: 'Laboratory',
    iconKey: IconKeys.modules.laboratory,
    roles: [],
    featureKey: 'laboratory',
  },
  {
    path: ROUTES.LAB_ALL_TESTS,
    terminologyKey: 'tests',
    labelFallback: 'All tests',
    iconKey: IconKeys.modules.labTests,
    roles: [],
    featureKey: 'laboratory',
  },
  {
    path: ROUTES.PAYMENTS,
    terminologyKey: 'payments',
    labelFallback: 'Payments',
    iconKey: IconKeys.modules.payments,
    roles: [],
    featureKey: 'payments',
  },
  {
    path: ROUTES.REPORTS,
    terminologyKey: 'reports',
    labelFallback: 'Reports',
    iconKey: IconKeys.modules.reports,
    roles: [],
    featureKey: 'reports',
  },
  {
    path: ROUTES.CATALOG,
    terminologyKey: 'catalog',
    labelFallback: 'Catalog',
    iconKey: IconKeys.modules.catalog,
    roles: [],
    featureKey: 'catalog',
  },
  {
    path: ROUTES.EVENT_LOG,
    terminologyKey: 'audit',
    labelFallback: 'Event log',
    iconKey: IconKeys.modules.eventLog,
    roles: [],
    featureKey: 'audit',
  },
];

export const SETTINGS_POPOVER_TRIGGER = {
  label: 'Settings',
  iconKey: IconKeys.ui.setting,
} as const;

export const SETTINGS_POPOVER_LINK_DEFINITIONS: readonly SettingsPopoverLinkDefinition[] = [
  {
    label: 'User management',
    iconKey: IconKeys.modules.users,
    path: ROUTES.USERS,
    roles: ['administrator'],
    featureKey: 'users',
  },
  {
    label: 'Notification & alerts',
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

/** @deprecated Use getFilteredSettingsPopoverLinkDefinitions */
export function getFilteredSettingsItems(
  hasRole: (roles: UserRole | UserRole[]) => boolean,
): SettingsPopoverLinkDefinition[] {
  return getFilteredSettingsPopoverLinkDefinitions(hasRole);
}
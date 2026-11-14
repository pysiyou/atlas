/**
 * Sidebar menu config and helpers — shared constants/functions so Sidebar.tsx can be component-only for Fast Refresh.
 */

import React, { type ReactNode } from 'react';
import { ROUTES } from '@/config';
import { IconKeys } from '@/config/icons';
import { Icon } from '@/components/primitives';
import { ICON_SIZE } from '@/theme/recipes';
import { getClientConfig, t } from '@/config/clientConfig';
import type { UserRole } from '@/types';

const navIconClass = ICON_SIZE.sidebarNav.icon;

export interface MenuItem {
  path: string;
  label: string;
  icon: ReactNode;
  roles: string[];
  featureKey?: string; // Optional feature flag key
}

/** Row inside the Settings sidebar popover. */
export interface SettingsPopoverLink {
  label: string;
  icon?: ReactNode;
  path?: string;
  disabled?: boolean;
  roles?: UserRole[];
  featureKey?: string; // Optional feature flag key
}

export type SettingsItem = SettingsPopoverLink;

// Note: Menu items use t() for terminology. Since this is a module-level array,
// the labels are computed at import time. For dynamic updates, convert to a function
// or use a component-level approach.
export const menuItems: MenuItem[] = [
  { path: ROUTES.DASHBOARD, label: t('dashboard', 'Dashboard'), icon: React.createElement(Icon, { iconKey: IconKeys.modules.dashboard, className: navIconClass }), roles: [], featureKey: 'dashboard' },
  { path: ROUTES.PATIENTS, label: t('patients', 'Patients'), icon: React.createElement(Icon, { iconKey: IconKeys.modules.patients, className: navIconClass }), roles: [], featureKey: 'patients' },
  { path: ROUTES.ORDERS, label: t('orders', 'Orders'), icon: React.createElement(Icon, { iconKey: IconKeys.modules.orders, className: navIconClass }), roles: [], featureKey: 'orders' },
  { path: ROUTES.LABORATORY, label: t('laboratory', 'Laboratory'), icon: React.createElement(Icon, { iconKey: IconKeys.modules.laboratory, className: navIconClass }), roles: [], featureKey: 'laboratory' },
  { path: ROUTES.LAB_ALL_TESTS, label: t('tests', 'All tests'), icon: React.createElement(Icon, { iconKey: IconKeys.modules.labTests, className: navIconClass }), roles: [], featureKey: 'laboratory' },
  { path: ROUTES.PAYMENTS, label: t('payments', 'Payments'), icon: React.createElement(Icon, { iconKey: IconKeys.modules.payments, className: navIconClass }), roles: [], featureKey: 'payments' },
  { path: ROUTES.REPORTS, label: t('reports', 'Reports'), icon: React.createElement(Icon, { iconKey: IconKeys.modules.reports, className: navIconClass }), roles: [], featureKey: 'reports' },
  { path: ROUTES.CATALOG, label: t('catalog', 'Catalog'), icon: React.createElement(Icon, { iconKey: IconKeys.modules.catalog, className: navIconClass }), roles: [], featureKey: 'catalog' },
  { path: ROUTES.EVENT_LOG, label: t('audit', 'Event log'), icon: React.createElement(Icon, { iconKey: IconKeys.modules.eventLog, className: navIconClass }), roles: [], featureKey: 'audit' },
];

export const settingsPopoverTrigger = {
  label: 'Settings',
  icon: React.createElement(Icon, { iconKey: IconKeys.ui.setting, className: navIconClass }),
} as const;

export const settingsPopoverLinks: SettingsPopoverLink[] = [
  {
    label: 'User management',
    icon: React.createElement(Icon, { iconKey: IconKeys.modules.users, className: navIconClass }),
    path: ROUTES.USERS,
    roles: ['administrator'],
    featureKey: 'users',
  },
  {
    label: 'Notification & alerts',
    icon: React.createElement(Icon, { iconKey: IconKeys.ui.bell, className: navIconClass }),
    disabled: true,
  },
];

/**
 * Check if a feature is enabled in the config
 * Returns true if feature is explicitly enabled or if config is not loaded yet (permissive default)
 */
function isFeatureEnabledInternal(featureKey: string | undefined): boolean {
  if (!featureKey) return true; // No feature key means always enabled
  
  const config = getClientConfig();
  if (!config || !config.features) return true; // Permissive default if config not loaded
  
  // If feature is explicitly defined, use that value; otherwise default to true
  return config.features[featureKey] !== false;
}

export function getFilteredMenuItems(): MenuItem[] {
  return menuItems.filter(item => isFeatureEnabledInternal(item.featureKey));
}

export function getFilteredSettingsPopoverLinks(
  hasRole: (roles: UserRole | UserRole[]) => boolean,
): SettingsPopoverLink[] {
  return settingsPopoverLinks.filter(item => {
    // Check feature flag first
    if (!isFeatureEnabledInternal(item.featureKey)) return false;
    
    // Then check role access
    if (!item.roles || item.roles.length === 0) return true;
    return hasRole(item.roles);
  });
}

export function getFilteredSettingsItems(
  hasRole: (roles: UserRole | UserRole[]) => boolean,
): SettingsPopoverLink[] {
  return getFilteredSettingsPopoverLinks(hasRole);
}

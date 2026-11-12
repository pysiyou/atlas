/**
 * Sidebar menu config and helpers — shared constants/functions so Sidebar.tsx can be component-only for Fast Refresh.
 */

import React, { type ReactNode } from 'react';
import { ROUTES } from '@/config';
import { IconKeys } from '@/config/icons';
import { Icon } from '@/components/primitives';
import { ICON_SIZE } from '@/theme/recipes';
import type { UserRole } from '@/types';

const navIconClass = ICON_SIZE.sidebarNav.icon;

export interface MenuItem {
  path: string;
  label: string;
  icon: ReactNode;
  roles: string[];
}

/** Row inside the Settings sidebar popover. */
export interface SettingsPopoverLink {
  label: string;
  icon?: ReactNode;
  path?: string;
  disabled?: boolean;
  roles?: UserRole[];
}

export type SettingsItem = SettingsPopoverLink;

export const menuItems: MenuItem[] = [
  { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: React.createElement(Icon, { iconKey: IconKeys.modules.dashboard, className: navIconClass }), roles: [] },
  { path: ROUTES.PATIENTS, label: 'Patients', icon: React.createElement(Icon, { iconKey: IconKeys.modules.patients, className: navIconClass }), roles: [] },
  { path: ROUTES.ORDERS, label: 'Orders', icon: React.createElement(Icon, { iconKey: IconKeys.modules.orders, className: navIconClass }), roles: [] },
  { path: ROUTES.LABORATORY, label: 'Laboratory', icon: React.createElement(Icon, { iconKey: IconKeys.modules.laboratory, className: navIconClass }), roles: [] },
  { path: ROUTES.LAB_ALL_TESTS, label: 'All tests', icon: React.createElement(Icon, { iconKey: IconKeys.modules.labTests, className: navIconClass }), roles: [] },
  { path: ROUTES.PAYMENTS, label: 'Payments', icon: React.createElement(Icon, { iconKey: IconKeys.modules.payments, className: navIconClass }), roles: [] },
  { path: ROUTES.REPORTS, label: 'Reports', icon: React.createElement(Icon, { iconKey: IconKeys.modules.reports, className: navIconClass }), roles: [] },
  { path: ROUTES.CATALOG, label: 'Catalog', icon: React.createElement(Icon, { iconKey: IconKeys.modules.catalog, className: navIconClass }), roles: [] },
  { path: ROUTES.EVENT_LOG, label: 'Event log', icon: React.createElement(Icon, { iconKey: IconKeys.modules.eventLog, className: navIconClass }), roles: [] },
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
  },
  {
    label: 'Notification & alerts',
    icon: React.createElement(Icon, { iconKey: IconKeys.ui.bell, className: navIconClass }),
    disabled: true,
  },
];

export function getFilteredMenuItems(): MenuItem[] {
  // For now, return all items until feature flags are fully wired
  // TODO: Import and use isFeatureEnabled once circular dependency is resolved
  return menuItems;
}

export function getFilteredSettingsPopoverLinks(
  hasRole: (roles: UserRole | UserRole[]) => boolean,
): SettingsPopoverLink[] {
  return settingsPopoverLinks.filter(item => {
    if (!item.roles || item.roles.length === 0) return true;
    return hasRole(item.roles);
  });
}

export function getFilteredSettingsItems(
  hasRole: (roles: UserRole | UserRole[]) => boolean,
): SettingsPopoverLink[] {
  return getFilteredSettingsPopoverLinks(hasRole);
}

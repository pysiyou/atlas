/**
 * Sidebar menu config and helpers — shared constants/functions so Sidebar.tsx can be component-only for Fast Refresh.
 */

import React, { type ReactNode } from 'react';
import { ROUTES } from '@/config';
import { MODULE_ICONS } from '@/config/icons';
import { Icon } from '@/components';
import type { UserRole } from '@/types';

export interface MenuItem {
  path: string;
  label: string;
  icon: ReactNode;
  roles: string[];
}

export interface SettingsItem {
  label: string;
  icon: ReactNode;
  path?: string;
  roles?: UserRole[];
}

export const menuItems: MenuItem[] = [
  { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: React.createElement(Icon, { name: MODULE_ICONS.dashboard, className: 'w-5 h-5' }), roles: [] },
  { path: ROUTES.PATIENTS, label: 'Patients', icon: React.createElement(Icon, { name: MODULE_ICONS.patients, className: 'w-5 h-5' }), roles: [] },
  { path: ROUTES.ORDERS, label: 'Orders', icon: React.createElement(Icon, { name: MODULE_ICONS.orders, className: 'w-5 h-5' }), roles: [] },
  { path: ROUTES.LABORATORY, label: 'Laboratory', icon: React.createElement(Icon, { name: MODULE_ICONS.laboratory, className: 'w-5 h-5' }), roles: [] },
  { path: ROUTES.PAYMENTS, label: 'Payments', icon: React.createElement(Icon, { name: MODULE_ICONS.payments, className: 'w-5 h-5' }), roles: [] },
  { path: ROUTES.REPORTS, label: 'Reports', icon: React.createElement(Icon, { name: MODULE_ICONS.reports, className: 'w-5 h-5' }), roles: [] },
  { path: ROUTES.CATALOG, label: 'Catalog', icon: React.createElement(Icon, { name: MODULE_ICONS.catalog, className: 'w-5 h-5' }), roles: [] },
  { path: ROUTES.EVENT_LOG, label: 'Event log', icon: React.createElement(Icon, { name: MODULE_ICONS.eventLog, className: 'w-5 h-5' }), roles: [] },
];

/** Settings: User management is live; remaining items stay disabled until those features exist. */
export const settingsItems: SettingsItem[] = [
  {
    label: 'User Management',
    icon: React.createElement(Icon, { name: MODULE_ICONS.users, className: 'w-5 h-5' }),
    path: ROUTES.USERS,
    roles: ['administrator'],
  },
  { label: 'System Settings', icon: React.createElement(Icon, { name: 'settings', className: 'w-5 h-5' }) },
  { label: 'Notification & Alerts', icon: React.createElement(Icon, { name: 'bell', className: 'w-5 h-5' }) },
];

export function getFilteredMenuItems(): MenuItem[] {
  return menuItems;
}

export function getFilteredSettingsItems(
  hasRole: (roles: UserRole | UserRole[]) => boolean
): SettingsItem[] {
  return settingsItems.filter(item => {
    if (!item.roles || item.roles.length === 0) return true;
    return hasRole(item.roles);
  });
}

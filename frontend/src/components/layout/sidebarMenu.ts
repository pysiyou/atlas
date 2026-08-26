/**
 * Sidebar menu config and helpers — shared constants/functions so Sidebar.tsx can be component-only for Fast Refresh.
 */

import React, { type ReactNode } from 'react';
import { ROUTES } from '@/config';
import { Icon } from '@/components';
import type { UserRole } from '@/types/enums/user';
import { getLabTabPath } from '@/features/lab/constants/labTabs';

export interface MenuItem {
  path: string;
  label: string;
  icon: ReactNode;
  roles: UserRole[];
}

export interface SettingsItem {
  label: string;
  icon: ReactNode;
}

export const menuItems: MenuItem[] = [
  {
    path: ROUTES.DASHBOARD,
    label: 'Dashboard',
    icon: React.createElement(Icon, { name: 'dashboard', className: 'w-5 h-5' }),
    roles: ['administrator', 'receptionist'],
  },
  {
    path: ROUTES.PATIENTS,
    label: 'Patients',
    icon: React.createElement(Icon, { name: 'users-group', className: 'w-5 h-5' }),
    roles: ['administrator', 'receptionist'],
  },
  {
    path: ROUTES.ORDERS,
    label: 'Orders',
    icon: React.createElement(Icon, { name: 'document', className: 'w-5 h-5' }),
    roles: ['administrator', 'receptionist'],
  },
  {
    path: ROUTES.LABORATORY,
    label: 'Laboratory',
    icon: React.createElement(Icon, { name: 'flask', className: 'w-5 h-5' }),
    roles: ['administrator', 'lab-technician', 'lab-technician-plus'],
  },
  {
    path: ROUTES.PAYMENTS,
    label: 'Payments',
    icon: React.createElement(Icon, { name: 'wallet', className: 'w-5 h-5' }),
    roles: ['administrator', 'receptionist'],
  },
  {
    path: ROUTES.REPORTS,
    label: 'Reports',
    icon: React.createElement(Icon, { name: 'document-medicine', className: 'w-5 h-5' }),
    roles: ['administrator', 'receptionist', 'lab-technician', 'lab-technician-plus'],
  },
  {
    path: ROUTES.CATALOG,
    label: 'Catalog',
    icon: React.createElement(Icon, { name: 'book', className: 'w-5 h-5' }),
    roles: ['administrator'],
  },
  {
    path: ROUTES.ADMIN,
    label: 'Administration',
    icon: React.createElement(Icon, { name: 'user-cog', className: 'w-5 h-5' }),
    roles: ['administrator'],
  },
];

/** Hidden until settings features are implemented. */
export const settingsItems: SettingsItem[] = [];

export function getFilteredMenuItems(role: UserRole | undefined): MenuItem[] {
  if (!role) return menuItems;
  return menuItems.filter(item => item.roles.includes(role));
}

/** Default landing route after login, based on user role. */
export function getDefaultRouteForRole(role: UserRole | undefined): string {
  switch (role) {
    case 'receptionist':
      return ROUTES.ORDERS;
    case 'lab-technician':
    case 'lab-technician-plus':
      return getLabTabPath('dashboard');
    case 'administrator':
    default:
      return ROUTES.DASHBOARD;
  }
}

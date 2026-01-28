/**
 * Sidebar Menu Configuration
 * Defines menu items and settings items for the sidebar
 */

import React from 'react';
import { UserCog, Settings, Bell, Box, Shield } from 'lucide-react';
import { ROUTES } from '@/config';
import { Icon } from '@/shared/ui';
import type { MenuItem, SettingsItem } from './types';

/**
 * Main menu items - active navigation links
 * Uses custom Icon component with SVG icons from public/icons directory
 */
export const menuItems: MenuItem[] = [
  {
    path: ROUTES.DASHBOARD,
    label: 'Dashboard',
    icon: React.createElement(Icon, { name: 'dashboard', className: 'w-5 h-5' }),
    roles: [],
  },
  {
    path: ROUTES.PATIENTS,
    label: 'Patients',
    icon: React.createElement(Icon, { name: 'users-group', className: 'w-5 h-5' }),
    roles: [],
  },
  {
    path: ROUTES.ORDERS,
    label: 'Orders',
    icon: React.createElement(Icon, { name: 'document', className: 'w-5 h-5' }),
    roles: [],
  },
  {
    path: ROUTES.LABORATORY,
    label: 'Laboratory',
    icon: React.createElement(Icon, { name: 'flask', className: 'w-5 h-5' }),
    roles: [],
  },
  {
    path: ROUTES.APPOINTMENTS,
    label: 'Appointments',
    icon: React.createElement(Icon, { name: 'calendar', className: 'w-5 h-5' }),
    roles: [],
  },
  {
    path: ROUTES.PAYMENTS,
    label: 'Payments',
    icon: React.createElement(Icon, { name: 'wallet', className: 'w-5 h-5' }),
    roles: [],
  },
  {
    path: ROUTES.REPORTS,
    label: 'Reports',
    icon: React.createElement(Icon, { name: 'document-medicine', className: 'w-5 h-5' }),
    roles: [],
  },
  {
    path: ROUTES.CATALOG,
    label: 'Catalog',
    icon: React.createElement(Icon, { name: 'book', className: 'w-5 h-5' }),
    roles: [],
  },
];

/**
 * Settings section items - disabled buttons
 */
export const settingsItems: SettingsItem[] = [
  {
    label: 'User Management',
    icon: React.createElement(UserCog, { size: 20 }),
  },
  {
    label: 'System Settings',
    icon: React.createElement(Settings, { size: 20 }),
  },
  {
    label: 'Notification & Alerts',
    icon: React.createElement(Bell, { size: 20 }),
  },
  {
    label: 'Integrations',
    icon: React.createElement(Box, { size: 20 }),
  },
  {
    label: 'Security & Privacy',
    icon: React.createElement(Shield, { size: 20 }),
  },
];

/**
 * Get all menu items (role-based filtering removed)
 */
export const getFilteredMenuItems = (): MenuItem[] => {
  return menuItems;
};

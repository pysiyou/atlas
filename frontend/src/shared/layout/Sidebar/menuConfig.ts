/**
 * Sidebar Menu Configuration
 * Defines menu items and settings items for the sidebar
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  FlaskConical,
  Calendar,
  Wallet,
  ClipboardList,
  UserCog,
  Settings,
  Bell,
  Box,
  Shield,
} from 'lucide-react';
import { ALL_ROLES } from '@/types';
import { ROUTES } from '@/config';
import type { MenuItem, SettingsItem } from './types';

/**
 * Main menu items - active navigation links
 */
export const menuItems: MenuItem[] = [
  {
    path: ROUTES.DASHBOARD,
    label: 'Dashboard',
    icon: React.createElement(LayoutDashboard, { size: 20 }),
    roles: ALL_ROLES,
  },
  {
    path: ROUTES.PATIENTS,
    label: 'Patients',
    icon: React.createElement(Users, { size: 20 }),
    roles: ['receptionist', 'administrator'],
  },
  {
    path: ROUTES.ORDERS,
    label: 'Orders',
    icon: React.createElement(FileText, { size: 20 }),
    roles: ALL_ROLES,
  },
  {
    path: ROUTES.LABORATORY,
    label: 'Laboratory',
    icon: React.createElement(FlaskConical, { size: 20 }),
    roles: ['lab-technician', 'pathologist', 'administrator'],
  },
  {
    path: ROUTES.APPOINTMENTS,
    label: 'Appointments',
    icon: React.createElement(Calendar, { size: 20 }),
    roles: ['receptionist', 'administrator'],
  },
  {
    path: ROUTES.PAYMENTS,
    label: 'Payments',
    icon: React.createElement(Wallet, { size: 20 }),
    roles: ['receptionist', 'administrator'],
  },
  {
    path: ROUTES.REPORTS,
    label: 'Reports',
    icon: React.createElement(ClipboardList, { size: 20 }),
    roles: ['pathologist', 'administrator'],
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
 * Filter menu items based on user role
 */
export const getFilteredMenuItems = (userRole: string | undefined): MenuItem[] => {
  if (!userRole) return [];
  return menuItems.filter((item) => item.roles.includes(userRole));
};

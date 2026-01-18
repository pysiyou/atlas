/**
 * Sidebar Types
 * Type definitions for sidebar components
 */

import type { ReactNode } from 'react';

/**
 * Interface for menu items
 */
export interface MenuItem {
  /** Route path */
  path: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon: ReactNode;
  /** Allowed user roles */
  roles: string[];
}

/**
 * Interface for settings items (disabled buttons)
 */
export interface SettingsItem {
  /** Display label */
  label: string;
  /** Icon component */
  icon: ReactNode;
}

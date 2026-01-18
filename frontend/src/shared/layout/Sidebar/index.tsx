/**
 * Sidebar Component
 * Navigation sidebar with role-based menu items
 * Organized into Header, Navigation, and Profile sections
 */

import React, { useState } from 'react';
import { useAuth } from '@/hooks';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import { SidebarProfile } from './SidebarProfile';
import { getFilteredMenuItems, settingsItems } from './menuConfig';

/**
 * Sidebar Component
 * Main sidebar container that composes Header, Nav, and Profile components
 */
export const Sidebar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter menu items based on user role
  const filteredMenuItems = getFilteredMenuItems(currentUser?.role);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden`}
      style={{ padding: '0' }}
    >
      {/* App Header - Logo Section */}
      <SidebarHeader
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Scrollable menu content */}
      <SidebarNav
        menuItems={filteredMenuItems}
        settingsItems={settingsItems}
        isCollapsed={isCollapsed}
      />

      {/* User Profile Section - Fixed at bottom */}
      {currentUser && (
        <SidebarProfile
          currentUser={currentUser}
          isCollapsed={isCollapsed}
          onLogout={logout}
        />
      )}
    </aside>
  );
};

// Re-export sub-components for flexibility
export { SidebarHeader } from './SidebarHeader';
export { SidebarNav } from './SidebarNav';
export { SidebarProfile } from './SidebarProfile';
export { menuItems, settingsItems, getFilteredMenuItems } from './menuConfig';
export type { MenuItem, SettingsItem } from './types';

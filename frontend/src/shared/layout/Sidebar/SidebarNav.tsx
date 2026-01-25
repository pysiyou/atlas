/**
 * SidebarNav Component
 * Navigation menu section of the sidebar
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import type { MenuItem, SettingsItem } from './types';
import { sidebarNav } from '@/shared/design-system/tokens/components/layout';

interface SidebarNavProps {
  /** Menu items to display */
  menuItems: MenuItem[];
  /** Settings items to display */
  settingsItems: SettingsItem[];
  /** Whether the sidebar is collapsed */
  isCollapsed: boolean;
  /** Callback when navigation occurs (for mobile close) */
  onNavigate?: () => void;
}

/**
 * SidebarNav Component
 * Displays the main navigation menu and settings section
 */
export const SidebarNav: React.FC<SidebarNavProps> = ({
  menuItems,
  settingsItems,
  isCollapsed,
  onNavigate,
}) => {
  /**
   * Handle navigation click (close mobile sidebar if needed)
   */
  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <div className={sidebarNav.container}>
      {/* Main Menu Section */}
      <div className={sidebarNav.section}>
        <div className={sidebarNav.sectionHeader(isCollapsed)}>
          <h3 className={sidebarNav.sectionTitle}>
            Main Menu
          </h3>
        </div>
        <nav className={sidebarNav.nav}>
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              onClick={handleNavClick}
              className={({ isActive }) => sidebarNav.navLink(isActive)}
            >
              {/* Fixed Width Icon Container */}
              <div className={sidebarNav.navIcon}>{item.icon}</div>

              {/* Text Content */}
              <span className={sidebarNav.navText(isCollapsed)}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Settings Section */}
      <div>
        <div className={sidebarNav.sectionHeader(isCollapsed)}>
          <h3 className={sidebarNav.sectionTitle}>
            Settings
          </h3>
        </div>
        <div className={sidebarNav.nav}>
          {settingsItems.map((item, index) => (
            <button
              key={index}
              disabled
              className={sidebarNav.settingsButton}
              title={isCollapsed ? item.label : 'Coming soon'}
            >
              <div className={sidebarNav.navIcon}>{item.icon}</div>
              <span className={sidebarNav.navText(isCollapsed)}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * SidebarNav Component
 * Navigation menu section of the sidebar
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import type { MenuItem, SettingsItem } from './types';

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

  const getNavLinkClasses = (isActive: boolean) => {
    const base = 'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg mx-2';
    return isActive
      ? `${base} bg-brand/10 text-brand`
      : `${base} text-text-secondary hover:bg-surface-hover hover:text-text-primary`;
  };

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {/* Main Menu Section */}
      <div className="mb-6">
        <div className={isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'px-4 mb-2 transition-all duration-300'}>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Main Menu
          </h3>
        </div>
        <nav className="space-y-1">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              onClick={handleNavClick}
              className={({ isActive }) => getNavLinkClasses(isActive)}
            >
              {/* Fixed Width Icon Container */}
              <div className="w-5 h-5 flex-shrink-0">{item.icon}</div>

              {/* Text Content */}
              <span className={isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'truncate transition-all duration-300'}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Settings Section */}
      <div>
        <div className={isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'px-4 mb-2 transition-all duration-300'}>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Settings
          </h3>
        </div>
        <div className="space-y-1">
          {settingsItems.map((item, index) => (
            <button
              key={index}
              disabled
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-disabled rounded-lg mx-2 cursor-not-allowed"
              title={isCollapsed ? item.label : 'Coming soon'}
            >
              <div className="w-5 h-5 flex-shrink-0">{item.icon}</div>
              <span className={isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'truncate transition-all duration-300'}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

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

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
      {/* Main Menu Section */}
      <div className="mb-6">
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'
          }`}
        >
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-6 whitespace-nowrap">
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
              className={({ isActive }) =>
                `flex items-center min-w-0 py-2.5 transition-colors relative ${
                  isActive ? 'bg-sky-50 text-sky-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {/* Fixed Width Icon Container */}
              <div className="w-16 flex items-center justify-center shrink-0">{item.icon}</div>

              {/* Text Content */}
              <span
                className={`text-sm whitespace-nowrap overflow-hidden transition-opacity duration-300 ${
                  isCollapsed ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Settings Section */}
      <div>
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'
          }`}
        >
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-6 whitespace-nowrap">
            Settings
          </h3>
        </div>
        <div className="space-y-1">
          {settingsItems.map((item, index) => (
            <button
              key={index}
              disabled
              className="flex items-center min-w-0 py-2.5 w-full text-left text-gray-400 cursor-not-allowed opacity-60"
              title={isCollapsed ? item.label : 'Coming soon'}
            >
              <div className="w-16 flex items-center justify-center shrink-0">{item.icon}</div>
              <span
                className={`text-sm whitespace-nowrap overflow-hidden transition-opacity duration-300 ${
                  isCollapsed ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

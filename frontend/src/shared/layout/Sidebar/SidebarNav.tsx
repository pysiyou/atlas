/**
 * SidebarNav Component
 * Navigation menu section of the sidebar
 * Fixed 4rem icon column per row; labels in content column clipped on collapse (no inner animation)
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import type { MenuItem, SettingsItem } from './types';

interface SidebarNavProps {
  menuItems: MenuItem[];
  settingsItems: SettingsItem[];
  isCollapsed: boolean;
  onNavigate?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  menuItems,
  settingsItems,
  onNavigate,
}) => {
  const handleNavClick = () => onNavigate?.();

  const getNavLinkClasses = (isActive: boolean) => {
    const base = 'flex items-center py-3 text-sm font-medium rounded-none border-l-2 border-transparent';
    return isActive
      ? `${base} border-l-brand text-brand`
      : `${base} text-fg-muted hover:bg-panel-hover hover:text-fg`;
  };

  return (
    <div className="flex-1 overflow-y-auto py-4 flex flex-col">
      {/* 1. Menu items */}
      <nav className="flex-1 min-h-0 space-y-1 px-0" aria-label="Main navigation">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={({ isActive }) => getNavLinkClasses(isActive)}
          >
            <div className="w-16 shrink-0 flex items-center justify-center">
              <div className="w-5 h-5 flex items-center justify-center">{item.icon}</div>
            </div>
            <span className="flex-1 min-w-0 overflow-hidden truncate" title={item.label}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* 2. Settings items */}
      <div className="mt-4 pt-4 border-t border-stroke">
        <div className="space-y-1" role="group" aria-label="Settings">
          {settingsItems.map((item, index) => (
            <button
              key={index}
              disabled
              className="w-full flex items-center py-3 text-sm font-medium text-fg-disabled rounded cursor-not-allowed"
              title={item.label}
            >
              <div className="w-16 shrink-0 flex items-center justify-center">
                <div className="w-5 h-5 flex items-center justify-center">{item.icon}</div>
              </div>
              <span className="flex-1 min-w-0 overflow-hidden truncate text-left">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

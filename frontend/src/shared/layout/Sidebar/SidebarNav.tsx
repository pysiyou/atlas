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
    const base = 'flex items-center py-3 text-sm font-medium rounded';
    return isActive
      ? `${base} bg-brand/10 text-brand`
      : `${base} text-text-secondary hover:bg-surface-hover hover:text-text-primary`;
  };

  return (
    <div className="flex-1 overflow-y-auto py-4">
      <div className="mb-6">
        <nav className="space-y-1">
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
              <span className="flex-1 min-w-0 overflow-hidden truncate px-3" title={item.label}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div>
        <div className="space-y-1">
          {settingsItems.map((item, index) => (
            <button
              key={index}
              disabled
              className="w-full flex items-center py-3 text-sm font-medium text-text-disabled rounded cursor-not-allowed"
              title={item.label}
            >
              <div className="w-16 shrink-0 flex items-center justify-center">
                <div className="w-5 h-5 flex items-center justify-center">{item.icon}</div>
              </div>
              <span className="flex-1 min-w-0 overflow-hidden truncate px-3 text-left">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

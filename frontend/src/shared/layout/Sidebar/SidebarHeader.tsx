/**
 * SidebarHeader Component
 * Logo and app title section of the sidebar
 */

import React from 'react';
import { Icon, IconButton } from '@/shared/ui';

interface SidebarHeaderProps {
  /** Whether the sidebar is collapsed */
  isCollapsed: boolean;
  /** Callback to toggle collapse state */
  onToggleCollapse: () => void;
  /** Callback to close sidebar on mobile (optional) */
  onMobileClose?: () => void;
}

/**
 * SidebarHeader Component
 * Displays the app logo, title, and collapse toggle
 */
export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isCollapsed,
  onToggleCollapse,
  onMobileClose,
}) => {
  return (
    <div className="border-b border-gray-200 shrink-0 h-[73px] flex items-center">
      <div className="flex items-center w-full h-full">
        {/* Logo */}
        <div
          className="w-16 flex items-center justify-center shrink-0 h-full cursor-pointer"
          onClick={() => isCollapsed && onToggleCollapse()}
          title={isCollapsed ? 'Expand Sidebar' : undefined}
        >
          <div
            className="transition-cursor flex items-center justify-center"
            onClick={() => isCollapsed && onToggleCollapse()}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <Icon name="app-logo" className="w-full h-full text-sky-600" />
            </div>
          </div>
        </div>

        {/* Title and collapse/close button */}
        <div
          className={`flex-1 flex items-center justify-between min-w-0 pr-4 transition-opacity duration-300 ${
            isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="min-w-0 overflow-hidden whitespace-nowrap">
            <h1 className="text-xs font-bold text-gray-900 truncate">Atlas Clinical Labs</h1>
            <p className="text-xs text-gray-500">Version 2.4</p>
          </div>
          {onMobileClose ? (
            <IconButton variant="close" size="sm" onClick={onMobileClose} title="Close Sidebar" />
          ) : (
            <IconButton
              variant="collapse"
              size="sm"
              onClick={onToggleCollapse}
              title="Collapse Sidebar"
            />
          )}
        </div>
      </div>
    </div>
  );
};

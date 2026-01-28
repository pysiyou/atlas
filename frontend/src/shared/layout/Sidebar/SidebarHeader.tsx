/**
 * SidebarHeader Component
 * Logo and app title section of the sidebar
 */

import React from 'react';
import { Icon, IconButton } from '@/shared/ui';
import { ICONS } from '@/utils';

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
    <div className="h-16 border-b border-border flex items-center px-4">
      <div className="flex items-center w-full h-full">
        {/* Logo */}
        <div
          className="w-12 h-12 flex items-center justify-center flex-shrink-0 cursor-pointer"
          onClick={() => isCollapsed && onToggleCollapse()}
          title={isCollapsed ? 'Expand Sidebar' : undefined}
        >
          <div
            className="transition-cursor flex items-center justify-center"
            onClick={() => isCollapsed && onToggleCollapse()}
          >
            <div className="w-8 h-8 text-brand">
              <Icon name={ICONS.ui.appLogo} className="w-full h-full" />
            </div>
          </div>
        </div>

        {/* Title and collapse/close button */}
        <div className={isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'flex items-center justify-between flex-1 ml-3 transition-all duration-300'}>
          <div className="min-w-0 overflow-hidden whitespace-nowrap">
            <h1 className="text-base font-bold text-text-primary truncate">Atlas Clinical Labs</h1>
            <p className="text-xs text-text-tertiary">Version 2.4</p>
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

/**
 * SidebarHeader Component
 * Logo and app title section of the sidebar
 */

import React from 'react';
import { Icon, IconButton } from '@/shared/ui';
import { ICONS } from '@/utils/icon-mappings';
import { sidebarHeader } from '@/shared/design-system/tokens/components/layout';

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
    <div className={sidebarHeader.container}>
      <div className="flex items-center w-full h-full">
        {/* Logo */}
        <div
          className={sidebarHeader.logoContainer}
          onClick={() => isCollapsed && onToggleCollapse()}
          title={isCollapsed ? 'Expand Sidebar' : undefined}
        >
          <div
            className="transition-cursor flex items-center justify-center"
            onClick={() => isCollapsed && onToggleCollapse()}
          >
            <div className={sidebarHeader.logoIcon}>
              <Icon name={ICONS.ui.appLogo} className="w-full h-full" />
            </div>
          </div>
        </div>

        {/* Title and collapse/close button */}
        <div className={sidebarHeader.titleContainer(isCollapsed)}>
          <div className="min-w-0 overflow-hidden whitespace-nowrap">
            <h1 className={sidebarHeader.title}>Atlas Clinical Labs</h1>
            <p className={sidebarHeader.subtitle}>Version 2.4</p>
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

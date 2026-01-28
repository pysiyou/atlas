/**
 * SidebarProfile Component
 * User profile section at the bottom of the sidebar
 */

import React, { useState } from 'react';
import { Avatar } from '@/shared/ui';
import { Button, IconButton } from '@/shared/ui';
import { formatStatus } from '@/utils/statusHelpers';
import type { AuthUser } from '@/types';
import defaultAvatar from '@/assets/images/default-avatar.jpg';

interface SidebarProfileProps {
  /** Current authenticated user */
  currentUser: AuthUser;
  /** Whether the sidebar is collapsed */
  isCollapsed: boolean;
  /** Callback to handle logout */
  onLogout: () => void;
}

/**
 * SidebarProfile Component
 * Displays user avatar, name, role, and logout button
 */
export const SidebarProfile: React.FC<SidebarProfileProps> = ({
  currentUser,
  isCollapsed,
  onLogout,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <div className="mt-auto border-t border-border p-4">
      {/* Profile Popover for Collapsed Mode */}
      {isCollapsed && showProfileMenu && (
        <div
          className="absolute bottom-20 left-20 bg-surface border border-border rounded-lg shadow-lg w-48 overflow-hidden z-50"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-text-primary truncate">{currentUser.name}</p>
            <p className="text-xs text-text-tertiary truncate">{formatStatus(currentUser.role)}</p>
          </div>
          <Button
            variant="logout"
            size="sm"
            fullWidth
            onClick={onLogout}
            className="justify-start rounded-none"
          >
            Logout
          </Button>
        </div>
      )}

      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => isCollapsed && setShowProfileMenu(!showProfileMenu)}
        title={isCollapsed ? 'Click for options' : undefined}
      >
        {/* User Avatar - Fixed Width w-16 */}
        <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
          <Avatar primaryText={currentUser.name} src={defaultAvatar} size="md" />
        </div>

        {/* User Info - Collapsible */}
        <div className={isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'flex items-center justify-between flex-1 min-w-0 transition-all duration-300'}>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-medium text-text-primary truncate">{currentUser.name}</p>
            <p className="text-xs text-text-tertiary truncate">{formatStatus(currentUser.role)}</p>
          </div>

          <IconButton
            variant="logout"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              onLogout();
            }}
            title="Logout"
            className="ml-2"
          />
        </div>
      </div>

      {/* Invisible backdrop to close popover */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          style={{ pointerEvents: 'auto', background: 'transparent' }}
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </div>
  );
};

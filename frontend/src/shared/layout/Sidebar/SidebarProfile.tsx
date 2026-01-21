/**
 * SidebarProfile Component
 * User profile section at the bottom of the sidebar
 */

import React, { useState } from 'react';
import { Avatar } from '@/shared/ui/Avatar';
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
    <div className="border-t border-gray-200 bg-gray-50 relative shrink-0">
      {/* Profile Popover for Collapsed Mode */}
      {isCollapsed && showProfileMenu && (
        <div
          className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded shadow-md border border-gray-100 py-1 z-50 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUser.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {formatStatus(currentUser.role)}
            </p>
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
        className="flex items-center cursor-pointer min-w-0 w-full py-4"
        onClick={() => isCollapsed && setShowProfileMenu(!showProfileMenu)}
        title={isCollapsed ? 'Click for options' : undefined}
      >
        {/* User Avatar - Fixed Width w-16 */}
        <div className="w-16 flex items-center justify-center shrink-0">
          <Avatar name={currentUser.name} src={defaultAvatar} size="md" />
        </div>

        {/* User Info - Collapsible */}
        <div
          className={`flex-1 min-w-0 flex items-center pr-4 transition-opacity duration-300 ${
            isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUser.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {formatStatus(currentUser.role)}
            </p>
          </div>

          <IconButton
            variant="logout"
            size="sm"
            onClick={(e) => {
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

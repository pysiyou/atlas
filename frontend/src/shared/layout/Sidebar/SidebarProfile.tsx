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
import { sidebarProfile } from '@/shared/design-system/tokens/components/layout';

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
    <div className={sidebarProfile.container}>
      {/* Profile Popover for Collapsed Mode */}
      {isCollapsed && showProfileMenu && (
        <div
          className={sidebarProfile.popover}
          onClick={e => e.stopPropagation()}
        >
          <div className={sidebarProfile.popoverHeader}>
            <p className={sidebarProfile.popoverName}>{currentUser.name}</p>
            <p className={sidebarProfile.popoverRole}>{formatStatus(currentUser.role)}</p>
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
        className={sidebarProfile.profileContainer}
        onClick={() => isCollapsed && setShowProfileMenu(!showProfileMenu)}
        title={isCollapsed ? 'Click for options' : undefined}
      >
        {/* User Avatar - Fixed Width w-16 */}
        <div className={sidebarProfile.avatarContainer}>
          <Avatar primaryText={currentUser.name} src={defaultAvatar} size="md" />
        </div>

        {/* User Info - Collapsible */}
        <div className={sidebarProfile.userInfo(isCollapsed)}>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className={sidebarProfile.userName}>{currentUser.name}</p>
            <p className={sidebarProfile.userRole}>{formatStatus(currentUser.role)}</p>
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
          className={sidebarProfile.backdrop}
          style={{ pointerEvents: 'auto', background: 'transparent' }}
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </div>
  );
};

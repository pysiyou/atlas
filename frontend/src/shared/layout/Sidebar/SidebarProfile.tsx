/**
 * SidebarProfile Component
 * User profile section at the bottom of the sidebar
 * Fixed 4rem icon column; content column clipped on collapse (no inner animation)
 * Uses shared Popover for self-positioning (flip/shift) so the menu stays fully visible.
 */

import React from 'react';
import { Avatar, Button, Popover } from '@/shared/ui';
import type { PopoverPlacement } from '@/shared/ui';
import { formatStatus } from '@/utils/statusHelpers';
import type { AuthUser } from '@/types';
import defaultAvatar from '@/assets/images/default-avatar.jpg';

interface SidebarProfileProps {
  currentUser: AuthUser;
  isCollapsed: boolean;
  onLogout: () => void;
}

export const SidebarProfile: React.FC<SidebarProfileProps> = ({
  currentUser,
  isCollapsed,
  onLogout,
}) => {
  const placement: PopoverPlacement = isCollapsed ? 'right-start' : 'top';

  return (
    <div className="mt-auto border-t border-stroke py-4">
      <Popover
        placement={placement}
        offsetValue={8}
        viewportPadding={8}
        showBackdrop={false}
        className="w-48 min-w-0"
        trigger={
          <div
            className="flex items-center py-0 cursor-pointer"
            title="Click for options"
            role="button"
            tabIndex={0}
          >
            <div className="w-16 shrink-0 flex items-center justify-center">
              <Avatar
                primaryText={currentUser.name}
                secondaryText={formatStatus(currentUser.role)}
                src={defaultAvatar}
                size="sm"
                avatarOnly
              />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden px-3">
              <p className="text-sm font-medium text-fg truncate">{currentUser.name}</p>
              <p className="text-xs text-fg-subtle truncate">{formatStatus(currentUser.role)}</p>
            </div>
          </div>
        }
      >
        {({ close }) => (
          <>
            <div className="px-4 py-3 border-b border-stroke">
              <p className="text-sm font-medium text-fg truncate">{currentUser.name}</p>
              <p className="text-xs text-fg-subtle truncate">{formatStatus(currentUser.role)}</p>
            </div>
            <Button
              variant="logout"
              size="sm"
              fullWidth
              onClick={() => {
                close();
                onLogout();
              }}
              className="justify-start rounded-none"
            >
              Logout
            </Button>
          </>
        )}
      </Popover>
    </div>
  );
};

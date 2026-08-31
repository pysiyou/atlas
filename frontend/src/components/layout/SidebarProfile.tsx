import { Avatar, Button, Popover } from '@/components';
import type { PopoverPlacement } from '@/components';
import { formatStatus } from '@/utils/string';
import type { AuthUser } from '@/types';
import defaultAvatar from '@/assets/default-avatar.jpg';

export interface SidebarProfileProps {
  currentUser: AuthUser;
  isCollapsed: boolean;
  onLogout: () => void;
}

export function SidebarProfile({ currentUser, isCollapsed, onLogout }: SidebarProfileProps) {
  const placement: PopoverPlacement = isCollapsed ? 'right-start' : 'top';
  return (
    <div className="mt-auto border-t border-border-default py-4">
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
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-normal text-text-primary truncate">{currentUser.name}</p>
              <p className="text-xs text-text-tertiary truncate">{formatStatus(currentUser.role)}</p>
            </div>
          </div>
        }
      >
        {({ close }) => (
          <>
            <div className="px-4 py-3 border-b border-border-default">
              <p className="text-sm font-normal text-text-primary truncate">{currentUser.name}</p>
              <p className="text-xs text-text-tertiary truncate">{formatStatus(currentUser.role)}</p>
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
}

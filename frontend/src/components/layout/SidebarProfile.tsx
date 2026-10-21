import { Avatar } from '@/components/primitives/Avatar';
import { Icon } from '@/components/primitives/Icon';
import { Popover, type PopoverPlacement } from '@/components/overlays/Popover';
import { ICONS } from '@/config/icons';
import { cn } from '@/utils';
import { formatStatus } from '@/utils/string';
import type { AuthUser } from '@/types';
import { text, CHROME, CONTROL, MENU_ITEM_TYPE, RADIUS, TONE } from '@/theme/recipes';

export interface SidebarProfileProps {
  currentUser: AuthUser;
  isCollapsed: boolean;
  onLogout: () => void;
}

export function SidebarProfile({ currentUser, isCollapsed, onLogout }: SidebarProfileProps) {
  const placement: PopoverPlacement = isCollapsed ? 'right-start' : 'top';

  return (
    <Popover
      placement={placement}
      offsetValue={8}
      viewportPadding={8}
      showBackdrop={false}
      className="w-56 min-w-0"
      trigger={
        <div
          className={cn(CHROME.navItem, 'cursor-pointer')}
          title={currentUser.name}
          role="button"
          tabIndex={0}
        >
          <div className={CHROME.navHit}>
            <div className={CHROME.navIconColumn}>
              <Avatar
                primaryText={currentUser.name}
                secondaryText={formatStatus(currentUser.role)}
                size="sm"
                avatarOnly
              />
            </div>
            <div className={cn(CHROME.navLabel, 'flex flex-col justify-center gap-space-0-5')}>
              <p className={`${text({ role: 'title-section' })} truncate leading-tight`}>{currentUser.name}</p>
              <p className={`${text({ role: 'body', intent: 'muted' })} truncate leading-tight`}>{formatStatus(currentUser.role)}</p>
            </div>
          </div>
        </div>
      }
    >
      {({ close }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-space-3 border-b border-border-default bg-surface-page px-space-3 py-space-3">
            <Avatar primaryText={currentUser.name} size="sm" avatarOnly />
            <div className="min-w-0 flex-1">
              <p className={`${text({ role: 'title-section' })} truncate`}>{currentUser.name}</p>
              <p className={`${text({ role: 'section-title' })} mt-space-0-5 truncate`}>
                {formatStatus(currentUser.role)}
              </p>
            </div>
          </div>
          <div className="p-space-1-5">
            <button
              type="button"
              className={cn(
                `flex w-full cursor-pointer items-center gap-space-2-5 px-space-2-5 py-space-2 text-left ${MENU_ITEM_TYPE}`,
                RADIUS.menuItem,
                TONE.danger.fg,
                'hover:bg-danger-bg transition-colors duration-150',
                CONTROL.focusVisibleDanger,
              )}
              onClick={() => {
                close();
                onLogout();
              }}
            >
              <Icon name={ICONS.actions.logout} className="size-4 shrink-0" />
              Log out
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}

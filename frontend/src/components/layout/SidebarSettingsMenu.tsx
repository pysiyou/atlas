import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/primitives/Icon';
import { Popover, type PopoverPlacement } from '@/components/overlays/Popover';
import { cn } from '@/utils';
import { text, CHROME, CONTROL, MENU_ITEM_TYPE, RADIUS } from '@/theme/recipes';
import type { SettingsPopoverLink } from '@/config/sidebarMenu';

export interface SidebarSettingsMenuProps {
  isCollapsed: boolean;
  triggerIcon: ReactNode;
  triggerLabel: string;
  items: SettingsPopoverLink[];
  onNavigate?: () => void;
}

export function SidebarSettingsMenu({
  isCollapsed,
  triggerIcon,
  triggerLabel,
  items,
  onNavigate,
}: SidebarSettingsMenuProps) {
  const navigate = useNavigate();
  const placement: PopoverPlacement = isCollapsed ? 'right-start' : 'right-start';

  return (
    <Popover
      placement={placement}
      offsetValue={8}
      viewportPadding={8}
      showBackdrop={false}
      className="w-56 min-w-0"
      trigger={({ isOpen }) => (
        <button
          type="button"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className={cn(CHROME.navItem, navRowReset, isOpen && 'bg-surface-hover')}
        >
          <NavRowBody icon={triggerIcon} label={triggerLabel} isActive={isOpen} />
        </button>
      )}
    >
      {({ close }) => (
        <div className="p-space-1-5" role="menu" aria-label={triggerLabel}>
          {items.map(item => {
            const rowClass = cn(
              `flex w-full items-center gap-space-2-5 px-space-2-5 py-space-2 text-left ${MENU_ITEM_TYPE}`,
              RADIUS.menuItem,
              item.disabled
                ? 'cursor-not-allowed text-text-muted opacity-60'
                : cn('cursor-pointer text-text-primary hover:bg-surface-hover', CONTROL.focusVisible),
            );
            const iconNode = item.icon ?? null;

            if (item.disabled || !item.path) {
              return (
                <div key={item.label} role="menuitem" aria-disabled="true" className={rowClass}>
                  {iconNode ? <span className="flex size-5 shrink-0 items-center justify-center">{iconNode}</span> : null}
                  <span className="truncate">{item.label}</span>
                </div>
              );
            }

            return (
              <button
                key={item.path}
                type="button"
                role="menuitem"
                className={rowClass}
                onClick={() => {
                  close();
                  navigate(item.path!);
                  onNavigate?.();
                }}
              >
                {iconNode ? <span className="flex size-5 shrink-0 items-center justify-center">{iconNode}</span> : null}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}

const navRowReset =
  'appearance-none bg-transparent p-0 m-0 border-0 text-left no-underline';

function NavRowBody({
  icon,
  label,
  isActive = false,
}: {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
}) {
  return (
    <>
      <div className={cn(CHROME.navHit, CHROME.navHitHover)}>
        <div className={CHROME.navIconColumn}>
          <div className={cn(CHROME.navIcon, isActive ? CHROME.navIconActive : CHROME.navIconHover)}>
            {icon}
          </div>
        </div>
        <span
          className={cn(
            CHROME.navLabel,
            'text-left',
            isActive ? CHROME.navLabelActive : CHROME.navLabelHover,
          )}
        >
          {label}
        </span>
      </div>
      <span className={CHROME.navTooltip} role="tooltip">
        {label}
      </span>
    </>
  );
}
